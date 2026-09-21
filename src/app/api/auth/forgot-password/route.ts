import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ForgotPasswordSchema } from "../schemas";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = ForgotPasswordSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expires: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      // In production: send email with reset link
      console.log(`Password reset token for ${email}: ${token}`);
    }

    return NextResponse.json({ ok: true, message: "If an account exists, a reset email was sent" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}