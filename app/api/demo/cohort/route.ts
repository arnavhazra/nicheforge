import { NextResponse } from "next/server";
import { buildCohort, cohortCsv } from "@/lib/cohort";
import { cleanLabel, corsHeaders } from "@/lib/http";
import { getNiche, isNicheId } from "@/lib/niches";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nicheParam = url.searchParams.get("niche") || "peptide";
  if (!isNicheId(nicheParam)) {
    return NextResponse.json({ error: "Unknown niche" }, { status: 400, headers: corsHeaders });
  }
  const niche = getNiche(nicheParam);
  const city = cleanLabel(url.searchParams.get("city") || "", `${niche.city}, ${niche.state}`, 80);
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(cohortCsv(nicheParam, city), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nicheParam}-stale-cohort.csv"`,
      },
    });
  }
  const cohort = buildCohort(nicheParam);
  return NextResponse.json(
    { total: cohort.total, summary: cohort.summary, leads: cohort.leads, city },
    { headers: corsHeaders },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
