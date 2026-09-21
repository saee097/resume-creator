import { NextResponse } from "next/server";
import { getUserFromCookie } from "@/app/api/auth/_utils";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user }, { status: 200 });
}
