import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/auth/_utils";
import { listDevices, trustDevice, revokeDevice } from "@/lib/auth/devices";

export async function GET() {
  try {
    const user = await requireAuth();
    const devices = await listDevices(user.id);
    return NextResponse.json({ devices }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { deviceId } = await request.json().catch(() => ({}));
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }
    await trustDevice(user.id, deviceId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const deviceId = request.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }
    await revokeDevice(user.id, deviceId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
