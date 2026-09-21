import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const TwoFactorEnableSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export const TwoFactorDisableSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type TwoFactorEnableInput = z.infer<typeof TwoFactorEnableSchema>;
export type TwoFactorDisableInput = z.infer<typeof TwoFactorDisableSchema>;