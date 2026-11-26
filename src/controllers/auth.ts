import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../../prisma/db.js";
import { signupSchema } from "../validations/signup.js";
import { loginSchema } from "../validations/login.js";
import { hashToken, isDev } from "../utils/func.js";
import { createSession } from "../services/session.services.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import jwt from "jsonwebtoken";

const COST = 12;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", COST);

type DbUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  passwordHash: string;
  matricNo: string | null;
  staffId: string | null;
  createdAt: Date;
};

const toPublicUser = (u: DbUser) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  department: u.department,
  matricNo: u.matricNo,
  staffId: u.staffId,
  createdAt: u.createdAt,
});

export const signup = async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { fullname, email, password, department, matric, staffID } =
    parsed.data;

  const normalizedEmail = email.toLowerCase();
  const role = matric ? ("STUDENT" as const) : ("LECTURER" as const);

  try {
    const existingEmail = await db.orm.public.User.whereUnique({
      email: normalizedEmail,
    }).first();
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email.",
      });
    }

    if (role === "STUDENT") {
      const existing = await db.orm.public.User.whereUnique({
        matricNo: matric ?? "",
      }).first();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This matric number is already registered.",
        });
      }
    } else {
      const existing = await db.orm.public.User.whereUnique({
        staffId: staffID ?? "",
      }).first();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This staff ID is already registered.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, COST);

    const result = await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.create({
        fullName: fullname,
        email: normalizedEmail,
        passwordHash,
        role,
        department,
        matricNo: role === "STUDENT" ? (matric ?? null) : null,
        staffId: role === "LECTURER" ? (staffID ?? null) : null,
      });

      const session = await createSession(user.id, user.role, tx);

      return { user, session };
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful.",
      accessToken: result.session.accessToken,
      refreshToken: result.session.refreshToken,
      sessionID: result.session.sessionID,
      user: toPublicUser(result.user),
    });
  } catch (error: unknown) {
    if (isDev()) console.error(error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with these details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { identifier, password } = parsed.data;

  try {
    let user: DbUser | null = null;

    if (identifier.includes("@")) {
      user = await db.orm.public.User.whereUnique({
        email: identifier.toLowerCase(),
      }).first();
    } else {
      const id = identifier.toUpperCase();
      user =
        (await db.orm.public.User.whereUnique({ matricNo: id }).first()) ??
        (await db.orm.public.User.whereUnique({ staffId: id }).first());
    }

    const passwordOk = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordOk) {
      return res.status(401).json({
        success: false,
        message: "Incorrect details. Check them and try again.",
      });
    }

    const session = await db.transaction(async (tx) => {
      const session = await createSession(user.id, user.role, tx);

      return session;
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      sessionID: session.sessionID,
      user: toPublicUser(user),
    });
  } catch (error: unknown) {
    if (isDev()) console.error(error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (typeof refreshToken !== "string" || !refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token was not provided.",
    });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const today = new Date();

    const session = await db.orm.public.Session.whereUnique({
      id: payload.sid,
    }).first();

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (session.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "This session is not active.",
      });
    }

    if (today >= session.expiresAt) {
      return res.status(401).json({
        success: false,
        message: "This session has expired.",
      });
    }

    if (session.userId !== payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    const tokenHash = hashToken(refreshToken);

    if (tokenHash !== session.tokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    const user = await db.orm.public.User.select("id", "role")
      .whereUnique({ id: payload.sub })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    const newAccessToken = generateAccessToken(user.id, user.role, payload.sid);
    const newRefreshToken = generateRefreshToken(user.id, payload.sid);
    const hashedRefreshToken = hashToken(newRefreshToken);

    const updatedSession = await db.orm.public.Session.where({
      id: payload.sid,
      tokenHash,
    }).update({
      tokenHash: hashedRefreshToken,
    });

    if (!updatedSession) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has already been used.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully.",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionID: payload.sid,
    });
  } catch (error) {
    if (isDev()) console.error(error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { accessToken } = req.body;
  const now = new Date();

  if (!accessToken || typeof accessToken !== "string") {
    return res.status(400).json({ message: "Inavlid session." });
  }

  try {
    const verifiedAccessToken = verifyAccessToken(accessToken);

    const session = await db.orm.public.Session.select("revokedAt", "userId")
      .whereUnique({ id: verifiedAccessToken.sid })
      .first();

    if (!session) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (session.userId !== verifiedAccessToken.sub) {
      return res.status(401).json({ message: "Invalid session." });
    }

    if (session.revokedAt) {
      return res.status(401).json({ message: "Invalid session." });
    }

    const updatedSession = await db.orm.public.Session.where({
      id: verifiedAccessToken.sid,
      userId: verifiedAccessToken.sub,
      revokedAt: null,
    }).update({
      revokedAt: now,
    });

    if (!updatedSession) {
      return res.status(401).json({
        success: false,
        message: "Session could not be revoked.",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "User logged out successfully." });
      
  } catch (error) {
    if (isDev()) console.error(error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};
