import { NextResponse } from "next/server";
import { parseContext } from "@/lib/conversation";
import { compilePack, packZip } from "@/lib/fulfillment";
import { corsHeaders } from "@/lib/http";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ctx = parseContext(body);
  if (!ctx) {
    return NextResponse.json({ error: "Unknown niche" }, { status: 400, headers: corsHeaders });
  }
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "zip") {
    const zip = packZip(ctx);
    return new NextResponse(Buffer.from(zip.bytes), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zip.filename}"`,
      },
    });
  }
  return NextResponse.json(compilePack(ctx), { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
