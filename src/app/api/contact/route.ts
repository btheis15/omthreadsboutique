import { NextResponse } from "next/server";
import { saveSubmission, validate } from "@/lib/inbox";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = validate({ ...body, kind: "message" });
  if (typeof result === "string") return NextResponse.json({ error: result }, { status: 400 });
  try {
    await saveSubmission(result);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
