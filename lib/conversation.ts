import { createHash } from "crypto";
import { fill } from "./http";
import { getNiche, isNicheId, type NicheId } from "./niches";

export type ProspectContext = {
  nicheId: NicheId;
  business: string;
  smsBrand: string;
  city: string;
  state: string;
};

export type ReplyResult = {
  sms: string;
  spoken: string;
  intent: "price" | "financing" | "schedule" | "confirm" | "general" | "safety" | "optout";
  tags: string[];
  stage: "Engaged" | "Qualified" | "Booked" | "DNC";
  booking: null | {
    when: string;
    service: string;
    duration: string;
    calendar: string;
    contact: string;
  };
};

const PROSPECT = "Sarah Mendez";
const FIRST = "Sarah";

export function liveBrand(nicheId: NicheId, business: string) {
  const niche = getNiche(nicheId);
  return business.trim() === niche.business ? niche.smsBrand : business.trim();
}

export function varsFor(ctx: ProspectContext) {
  return {
    first: FIRST,
    prospect: PROSPECT,
    business: ctx.business,
    smsBrand: ctx.smsBrand,
    city: ctx.city,
    state: ctx.state,
    when: getNiche(ctx.nicheId).slot.when,
  };
}

export function openerFor(ctx: ProspectContext) {
  const text = fill(getNiche(ctx.nicheId).opener, varsFor(ctx));
  return { sms: text, spoken: text };
}

function detectIntent(nicheId: NicheId, message: string, booked: boolean) {
  const text = message.toLowerCase().trim();
  if (/^\s*(stop|unsubscribe|remove me|do not (text|call)|dnc)\b/.test(text) || text === "stop") {
    return "optout" as const;
  }
  if (getNiche(nicheId).safety.test(message)) return "safety" as const;
  if (/thursday|afternoon|schedule|appointment|come in|come by|\bbook\b|calendar|arrival window/.test(text)) {
    return "schedule" as const;
  }
  if (/how much|price|cost|\$|bloodwork|package|\bfee\b|dispatch/.test(text)) return "price" as const;
  if (/hsa|fsa|financ|carecredit|insurance|cover|payment plan/.test(text)) {
    return "financing" as const;
  }
  if (/^(yes|yeah|yep|confirm|lock it|book it|that works|perfect|ok|okay)\b/.test(text)) {
    return "confirm" as const;
  }
  if (booked) return "confirm" as const;
  return "general" as const;
}

export function replyToProspect(
  ctx: ProspectContext,
  message: string,
  booked: boolean,
): ReplyResult {
  const niche = getNiche(ctx.nicheId);
  const intent = detectIntent(ctx.nicheId, message, booked);
  const text = fill(niche.answers[intent], varsFor(ctx));
  const base = [`niche:${niche.id}`, "speed-to-lead"];

  if (intent === "optout") {
    return {
      sms: text,
      spoken: text,
      intent,
      tags: [...base, "dnc", "opt-out"],
      stage: "DNC",
      booking: null,
    };
  }

  if (intent === "safety") {
    return {
      sms: text,
      spoken: text,
      intent,
      tags: [...base, "provider-escalation"],
      stage: "Qualified",
      booking: null,
    };
  }

  if (intent === "schedule" || intent === "confirm") {
    return {
      sms: text,
      spoken: text,
      intent,
      tags: [...base, "booked-consult", "calendar-hold"],
      stage: "Booked",
      booking: {
        when: niche.slot.when,
        service: niche.slot.service,
        duration: niche.slot.duration,
        calendar: "GoHighLevel — New Patient",
        contact: PROSPECT,
      },
    };
  }

  const tag = intent === "price" ? "price-question" : intent === "financing" ? "financing-question" : "qualifying";
  return {
    sms: text,
    spoken: text,
    intent,
    tags: [...base, tag],
    stage: intent === "general" ? "Engaged" : "Qualified",
    booking: null,
  };
}

export function missedCallPayload(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  const bucket = new Date().toISOString().slice(0, 16);
  const idempotencyKey = createHash("sha256")
    .update(`${niche.prospectPhone}|${ctx.business}|${bucket}`)
    .digest("hex")
    .slice(0, 16);
  const contactId = `ghl_${idempotencyKey.slice(0, 10)}`;
  const opener = openerFor(ctx);
  return {
    webhook: {
      event: "inbound.call.missed",
      status: 200,
      idempotencyKey,
      contactId,
      phone: niche.prospectPhone,
      trackingLine: niche.trackingPhone,
      duplicate: false,
    },
    contact: {
      name: PROSPECT,
      phone: niche.prospectPhone,
      stage: "Speed-to-Lead",
      tags: ["missed-call", "speed-to-lead", `niche:${niche.id}`],
    },
    sms: opener.sms,
    spoken: opener.spoken,
  };
}

export function parseContext(body: unknown): ProspectContext | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const nicheId = typeof record.nicheId === "string" ? record.nicheId : "";
  if (!isNicheId(nicheId)) return null;
  const niche = getNiche(nicheId);
  const business =
    typeof record.business === "string" && record.business.trim()
      ? record.business.replace(/[\u0000-\u001F]/g, "").trim().slice(0, 80)
      : niche.business;
  const city =
    typeof record.city === "string" && record.city.trim()
      ? record.city.replace(/[\u0000-\u001F]/g, "").trim().slice(0, 60)
      : niche.city;
  const state =
    typeof record.state === "string" && record.state.trim()
      ? record.state.replace(/[\u0000-\u001F]/g, "").trim().slice(0, 40)
      : niche.state;
  return {
    nicheId,
    business,
    smsBrand: liveBrand(nicheId, business),
    city,
    state,
  };
}
