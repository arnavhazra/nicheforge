import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/http";
import { NICHES, PILLAR_COUNT } from "@/lib/niches";

export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "lumina-nicheforge", niches: NICHES.length, pillars: PILLAR_COUNT },
    { headers: corsHeaders },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
