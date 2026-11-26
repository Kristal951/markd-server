import { createHash } from "node:crypto";

export const isDev = () => {
  if (process.env.environment === "dev") {
    return true;
  } else {
    return false;
  }
};

export const hashToken = (token: string): string => {
  if (!token) {
    throw new Error("Token must not be empty.");
  }

  return createHash("sha256").update(token).digest("hex");
};