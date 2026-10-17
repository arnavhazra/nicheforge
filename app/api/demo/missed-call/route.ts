import { NextResponse } from "next/server";
import { missedCallPayload, parseContext } from "@/lib/conversation";
import { corsHeaders } from "@/lib/http";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = parseContext(body);
  if (!ctx) {
    return NextResponse.json({ error: "Unknown niche" }, { status: 400, headers: corsHeaders });
  }
  return NextResponse.json(missedCallPayload(ctx), { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
