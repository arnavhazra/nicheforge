import { NextResponse } from "next/server";
import { buildAeoReport } from "@/lib/aeo";
import { corsHeaders, splitCity } from "@/lib/http";
import { getNiche, isNicheId } from "@/lib/niches";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const nicheId = typeof record.nicheId === "string" ? record.nicheId : "";
  if (!isNicheId(nicheId)) {
    return NextResponse.json({ error: "Unknown niche" }, { status: 400, headers: corsHeaders });
  }
  const niche = getNiche(nicheId);
  const business =
    typeof record.business === "string" && record.business.trim()
      ? record.business.replace(/[\u0000-\u001F]/g, "").trim().slice(0, 80)
      : niche.business;
  const cityLine =
    typeof record.cityLine === "string" && record.cityLine.trim()
      ? record.cityLine
      : `${niche.city}, ${niche.state}`;
  const { city, state } = splitCity(cityLine, niche.state);
  return NextResponse.json(buildAeoReport({ nicheId, business, city, state }), { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
