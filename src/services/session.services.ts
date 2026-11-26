import crypto from "node:crypto";
import { db, Tx } from "../../prisma/db.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/func.js";

export const createSession = async (userId: string, role: string, tx: Tx) => {
  const sessionID = crypto.randomUUID();
  const accessToken = generateAccessToken(userId, role, sessionID);
  const refreshToken = generateRefreshToken(userId, sessionID);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await tx.orm.public.Session.create({
    id: sessionID,
    userId,
    tokenHash: refreshTokenHash,
    expiresAt,
  });

  return {
    sessionID,
    accessToken,
    refreshToken,
  };
};
