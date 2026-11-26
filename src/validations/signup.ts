import { z } from "zod";

export const signupSchema = z
  .object({
    fullname: z
      .string()
      .trim()
      .min(1, "Full name is required.")
      .max(100, "Full name is too long."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address."),
    password: z.string().min(8, "Password must contain at least 8 characters."),
    department: z.string().trim().min(1, "Department is required."),
    matric: z.string().trim().toUpperCase().optional(),
    staffID: z.string().trim().toUpperCase().optional(),
  })
  .superRefine((data, ctx) => {
    const hasMatric = Boolean(data.matric);
    const hasStaffID = Boolean(data.staffID);

    if (hasMatric === hasStaffID) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either a matric number or a staff ID, not both.",
        path: ["matric"],
      });
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;
