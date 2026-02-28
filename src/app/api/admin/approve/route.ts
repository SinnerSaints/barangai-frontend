import { NextResponse } from "next/server";

// This file mutates the same in-memory store used by pending route.
import { PENDING as _PENDING } from "../_store";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const idx = _PENDING.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = _PENDING.splice(idx, 1)[0];

    // In production you'd mark the user active in DB here.
    return NextResponse.json({ success: true, user: item });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
