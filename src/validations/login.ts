import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your matric number, staff ID or email"),
  password: z.string().min(1, "Enter your password"),
});
