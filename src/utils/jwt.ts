import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export const generateAccessToken = (
  id: string,
  role: string,
  sessionId: string,
): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!id || !role || !sessionId) {
    throw new Error("User ID, role and session ID are required.");
  }

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is missing.");
  }

  return jwt.sign(
    {
      sub: id,
      role,
      sid: sessionId,
    },
    secret,
    {
      expiresIn: "15m",
      algorithm: "HS256",
    },
  );
};

export const generateRefreshToken = (id: string, sessionId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!id || !sessionId) {
    throw new Error("User ID and session ID are required.");
  }

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is missing.");
  }

  return jwt.sign(
    {
      sub: id,
      sid: sessionId,
      jti: randomUUID(),
    },
    secret,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    },
  );
};

type RefreshTokenPayload = {
  sub: string;
  sid: string;
  jti: string;
};

type AccessTokenPayload = {
  sub: string;
  sid: string;
  role: string;
};

export const verifyAccessToken = (accessToken: string): AccessTokenPayload => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!accessToken) {
    throw new Error("accessToken is required.");
  }

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is missing.");
  }

  const payload = jwt.verify(accessToken, secret, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid access token payload.");
  }

  return payload as AccessTokenPayload;
};

export const verifyRefreshToken = (refreshToken: string): RefreshTokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!refreshToken) {
    throw new Error("refreshToken is required.");
  }

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is missing.");
  }

  const payload = jwt.verify(refreshToken, secret, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw new Error("Invalid refresh token payload.");
  }

  return payload as RefreshTokenPayload;
};
