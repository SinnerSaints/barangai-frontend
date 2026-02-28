import { NextResponse } from "next/server";
import { PENDING } from "../_store";

export async function GET() {
  return NextResponse.json(PENDING);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nextId = PENDING.length ? Math.max(...PENDING.map((p) => p.id)) + 1 : 1;
    const item = { id: nextId, email: body.email || `user${nextId}@example.com`, password: body.password || "", role: body.role || "OFFICIALS" };
    PENDING.push(item);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
