import { NextResponse } from "next/server";
import { parseContext, replyToProspect } from "@/lib/conversation";
import { corsHeaders } from "@/lib/http";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = parseContext(body);
  const message =
    body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message.trim().slice(0, 500)
      : "";
  if (!ctx || !message) {
    return NextResponse.json({ error: "Niche and message are required" }, { status: 400, headers: corsHeaders });
  }
  const booked = Boolean(body && typeof body === "object" && (body as { booked?: unknown }).booked);
  return NextResponse.json(replyToProspect(ctx, message, booked), { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
