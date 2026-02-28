import { NextResponse } from "next/server";
import { PENDING } from "../_store";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const idx = PENDING.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = PENDING.splice(idx, 1)[0];

    // In production you'd delete or mark the registration as rejected in DB here.
    return NextResponse.json({ success: true, user: item });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
