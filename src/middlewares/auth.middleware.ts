import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { db } from "../../prisma/db.js";
import { isDev } from "../utils/func.js";
import jwt from "jsonwebtoken";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;
  const now = new Date();

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing or invalid.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing.",
    });
  }

  try {
    const verifiedAccessToken = verifyAccessToken(token);

    const session = await db.orm.public.Session.select(
      "userId",
      "revokedAt",
      "expiresAt",
    )
      .whereUnique({ id: verifiedAccessToken.sid })
      .first();

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    if (session.userId !== verifiedAccessToken.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    if (session.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked.",
      });
    }

    if (now >= session.expiresAt) {
      return res.status(401).json({
        success: false,
        message: "Session has expired.",
      });
    }

    req.user = {
      id: verifiedAccessToken.sub,
      role: verifiedAccessToken.role,
      sessionId: verifiedAccessToken.sid,
    };

    return next();
  } catch (error) {
    if (isDev()) console.error(error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};
