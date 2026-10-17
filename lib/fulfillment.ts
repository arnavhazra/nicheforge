import { buildJsonLd } from "./aeo";
import { liveBrand, type ProspectContext } from "./conversation";
import { fill, slugify } from "./http";
import { getNiche, type NicheId } from "./niches";
import { zipStore } from "./zip";

export const ROI = {
  deliveryMinutes: 16,
  deliveryCeilingMinutes: 18,
  monthlyCogsUsd: 14.2,
  retainerUsd: 1500,
  grossMarginPct: 99.1,
  centBudgetCap: 2500,
};

const encoder = new TextEncoder();

function promptFor(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  const services = niche.services.join("; ");
  return [
    `You are the after-hours receptionist for ${ctx.business} in ${ctx.city}, ${ctx.state}.`,
    `The text-back brand is ${ctx.smsBrand}. You book visits. You do not practice medicine, promise insurance coverage, or invent prices.`,
    `Services you may name: ${services}.`,
    `Economics you may repeat and must not exceed: ${niche.economics}. Offer ${niche.slot.when} for a ${niche.slot.service} (${niche.slot.duration}).`,
    "Rules:",
    "- If they want texts or calls to stop, confirm the opt-out, tag DNC, and end.",
    "- If they ask for dosing, diagnosis, sourcing, refrigerant handling, or a guaranteed claim approval, refuse and offer the licensed visit.",
    "- Never collect card numbers, social security numbers, or full insurance member IDs.",
    "- Ask one question at a time. Keep replies under two sentences unless they ask for detail.",
    "- When they agree to a time, call book_appointment and tag_contact.",
    `- First text, if you are recovering a missed call: ${fill(niche.opener, { first: "there", smsBrand: ctx.smsBrand, city: ctx.city })}`,
  ].join("\n");
}

function tools(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  return [
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: `Hold ${niche.slot.service} on the GoHighLevel calendar.`,
        parameters: {
          type: "object",
          properties: {
            contact_name: { type: "string" },
            phone: { type: "string" },
            service: { type: "string", enum: niche.services },
            starts_at: { type: "string", description: "ISO local datetime" },
          },
          required: ["contact_name", "phone", "service", "starts_at"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "tag_contact",
        description: "Apply GoHighLevel tags after qualification.",
        parameters: {
          type: "object",
          properties: {
            contact_id: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["contact_id", "tags"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "escalate_to_human",
        description: "Hand clinical, coverage, or safety questions to a licensed staffer.",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string" },
            urgency: { type: "string", enum: ["routine", "same_day", "emergency"] },
          },
          required: ["reason", "urgency"],
        },
      },
    },
  ];
}

export function voiceAgent(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  const prompt = promptFor(ctx);
  const guardrails = [
    "No diagnosis, dosing, compounding, or medication sourcing.",
    "No guaranteed insurance approval or coverage amounts.",
    "No DIY refrigerant, asbestos, or carbon-monoxide instructions. Emergencies go to local emergency services.",
    "Honor STOP immediately and write a DNC tag.",
    "Do not collect payment credentials.",
    `Do not quote above the published economics: ${niche.economics}.`,
  ];
  return {
    providers: ["retell", "vapi"],
    retell: {
      agent_name: `${ctx.smsBrand} Receptionist`,
      voice_id: "11labs-Rachel",
      language: "en-US",
      responsiveness: 0.82,
      interruption_sensitivity: 0.55,
      enable_backchannel: true,
      ambient_sound: "off",
      general_prompt: prompt,
      guardrails,
      webhook_url: "https://example.com/webhooks/retell",
      general_tools: tools(ctx),
    },
    vapi: {
      name: `${ctx.smsBrand} Receptionist`,
      firstMessage: fill(niche.opener, {
        first: "there",
        smsBrand: ctx.smsBrand,
        city: ctx.city,
      }),
      voice: { provider: "11labs", voiceId: "Rachel" },
      model: {
        provider: "openai",
        model: "gpt-4.1-mini",
        messages: [{ role: "system", content: prompt }],
        tools: tools(ctx),
      },
      endCallFunctionEnabled: true,
      serverUrl: "https://example.com/webhooks/vapi",
      guardrails,
    },
    extractionSchema: {
      type: "object",
      properties: {
        caller_name: { type: "string" },
        phone: { type: "string" },
        intent: {
          type: "string",
          enum: ["book", "price", "financing", "safety", "opt_out", "other"],
        },
        service_interest: { type: "string", enum: niche.services },
        preferred_time: { type: "string" },
      },
      required: ["intent"],
    },
  };
}

function node(
  id: string,
  name: string,
  type: string,
  position: [number, number],
  parameters: Record<string, unknown>,
) {
  return { id, name, type, typeVersion: 2, position, parameters };
}

export function n8nWorkflow(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  const nodes = [
    node("8f1a6c10-1111-4a11-9c11-000000000001", "Missed Call Webhook", "n8n-nodes-base.webhook", [0, 280], {
      httpMethod: "POST",
      path: `nicheforge-${niche.id}-missed-call`,
      responseMode: "responseNode",
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000002", "Idempotency Check", "n8n-nodes-base.code", [260, 280], {
      language: "javaScript",
      jsCode: [
        "const crypto = require('crypto');",
        "const phone = $json.body?.phone || $json.phone || '';",
        "const bucket = new Date().toISOString().slice(0, 16);",
        "const key = crypto.createHash('sha256').update(phone + '|' + bucket).digest('hex');",
        "const store = $getWorkflowStaticData('global');",
        "store.seen = store.seen || {};",
        "const duplicate = Boolean(store.seen[key]);",
        "store.seen[key] = Date.now();",
        "return [{ json: { ...$json, idempotencyKey: key, duplicate } }];",
      ].join("\n"),
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000003", "Is New Event", "n8n-nodes-base.if", [520, 280], {
      conditions: {
        combinator: "and",
        conditions: [
          {
            leftValue: "={{ $json.duplicate }}",
            rightValue: false,
            operator: { type: "boolean", operation: "false" },
          },
        ],
      },
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000004", "Ignore Duplicate", "n8n-nodes-base.respondToWebhook", [760, 80], {
      respondWith: "json",
      responseBody: '={{ JSON.stringify({ ok: true, ignored: true, idempotencyKey: $json.idempotencyKey }) }}',
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000005", "GHL Contact Upsert", "n8n-nodes-base.httpRequest", [760, 420], {
      method: "POST",
      url: "https://services.leadconnectorhq.com/contacts/upsert",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "Authorization", value: "=Bearer {{$env.GHL_PRIVATE_TOKEN}}" },
          { name: "Version", value: "2021-07-28" },
          { name: "Content-Type", value: "application/json" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: `={{ JSON.stringify({ locationId: $env.GHL_LOCATION_ID, phone: $json.body.phone, firstName: $json.body.firstName, lastName: $json.body.lastName, source: ${JSON.stringify(`${ctx.smsBrand} missed call`)}, tags: ['missed-call','speed-to-lead', ${JSON.stringify(`niche:${niche.id}`)}] }) }}`,
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000006", "Send SMS Sequence", "n8n-nodes-base.httpRequest", [1020, 420], {
      method: "POST",
      url: "https://services.leadconnectorhq.com/conversations/messages",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "Authorization", value: "=Bearer {{$env.GHL_PRIVATE_TOKEN}}" },
          { name: "Version", value: "2021-07-28" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: `={{ JSON.stringify({ type: 'SMS', contactId: $json.contact.id, message: ${JSON.stringify(fill(niche.opener, { first: "there", smsBrand: ctx.smsBrand, city: ctx.city }))} }) }}`,
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000007", "Inbound Reply Webhook", "n8n-nodes-base.webhook", [0, 760], {
      httpMethod: "POST",
      path: `nicheforge-${niche.id}-sms-reply`,
      responseMode: "responseNode",
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000008", "Classify Reply", "n8n-nodes-base.code", [260, 760], {
      language: "javaScript",
      jsCode: [
        "const text = String($json.body?.message || '').toLowerCase();",
        "let intent = 'qualifying';",
        "if (/^stop\\b|unsubscribe|remove me/.test(text)) intent = 'optout';",
        "else if (/thursday|book|appointment|afternoon/.test(text)) intent = 'book';",
        "else if (/how much|price|cost/.test(text)) intent = 'price';",
        "else if (/financ|hsa|fsa|insurance|carecredit/.test(text)) intent = 'financing';",
        "return [{ json: { ...$json, intent } }];",
      ].join("\n"),
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000009", "Is Booking Intent", "n8n-nodes-base.if", [520, 760], {
      conditions: {
        combinator: "and",
        conditions: [
          {
            leftValue: "={{ $json.intent }}",
            rightValue: "book",
            operator: { type: "string", operation: "equals" },
          },
        ],
      },
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000010", "Book Calendar Slot", "n8n-nodes-base.httpRequest", [780, 640], {
      method: "POST",
      url: "https://services.leadconnectorhq.com/calendars/events/appointments",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "Authorization", value: "=Bearer {{$env.GHL_PRIVATE_TOKEN}}" },
          { name: "Version", value: "2021-07-28" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: `={{ JSON.stringify({ calendarId: $env.GHL_CALENDAR_ID, locationId: $env.GHL_LOCATION_ID, contactId: $json.body.contactId, title: ${JSON.stringify(niche.slot.service)}, selectedSlot: $json.body.slot }) }}`,
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000011", "Move Opportunity To Booked", "n8n-nodes-base.httpRequest", [1040, 640], {
      method: "PUT",
      url: "=https://services.leadconnectorhq.com/opportunities/{{$json.opportunityId}}",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "Authorization", value: "=Bearer {{$env.GHL_PRIVATE_TOKEN}}" },
          { name: "Version", value: "2021-07-28" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: '={{ JSON.stringify({ status: "open", stageId: $env.GHL_STAGE_BOOKED }) }}',
    }),
    node("8f1a6c10-1111-4a11-9c11-000000000012", "Tag Follow-up Or DNC", "n8n-nodes-base.httpRequest", [780, 900], {
      method: "POST",
      url: "=https://services.leadconnectorhq.com/contacts/{{$json.body.contactId}}/tags",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "Authorization", value: "=Bearer {{$env.GHL_PRIVATE_TOKEN}}" },
          { name: "Version", value: "2021-07-28" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        "={{ JSON.stringify({ tags: $json.intent === 'optout' ? ['dnc','opt-out'] : ['price-question','timing-followup'] }) }}",
    }),
  ];

  return {
    name: `NicheForge — ${ctx.smsBrand} missed-call text-back`,
    active: false,
    settings: { executionOrder: "v1" },
    pinData: {},
    meta: { nicheforge: "missed-call-to-calendar" },
    nodes,
    connections: {
      "Missed Call Webhook": { main: [[{ node: "Idempotency Check", type: "main", index: 0 }]] },
      "Idempotency Check": { main: [[{ node: "Is New Event", type: "main", index: 0 }]] },
      "Is New Event": {
        main: [
          [{ node: "GHL Contact Upsert", type: "main", index: 0 }],
          [{ node: "Ignore Duplicate", type: "main", index: 0 }],
        ],
      },
      "GHL Contact Upsert": { main: [[{ node: "Send SMS Sequence", type: "main", index: 0 }]] },
      "Inbound Reply Webhook": { main: [[{ node: "Classify Reply", type: "main", index: 0 }]] },
      "Classify Reply": { main: [[{ node: "Is Booking Intent", type: "main", index: 0 }]] },
      "Is Booking Intent": {
        main: [
          [{ node: "Book Calendar Slot", type: "main", index: 0 }],
          [{ node: "Tag Follow-up Or DNC", type: "main", index: 0 }],
        ],
      },
      "Book Calendar Slot": { main: [[{ node: "Move Opportunity To Booked", type: "main", index: 0 }]] },
    },
  };
}

export function ghlManifest(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  return {
    locationName: ctx.business,
    snapshotName: `NicheForge ${niche.shortLabel} — ${ctx.city}`,
    pipeline: {
      name: `${niche.shortLabel} Speed-to-Lead`,
      stages: [
        "Speed-to-Lead",
        "Engaged",
        "Qualified",
        "Booked",
        "Showed",
        "Won",
        "Lost / Nurture",
      ],
    },
    tags: [
      "missed-call",
      "speed-to-lead",
      "booked-consult",
      "price-question",
      "financing-question",
      "timing-followup",
      "hot-booking-intent",
      "reactivation-wave",
      "dnc",
      "opt-out",
      `niche:${niche.id}`,
    ],
    customFields: [
      { key: "service_interest", type: "text" },
      { key: "preferred_time", type: "text" },
      { key: "ticket_estimate_usd", type: "number" },
      { key: "aeo_citation_score", type: "number" },
      { key: "lead_cohort", type: "text" },
      { key: "niche", type: "text" },
      { key: "dnc", type: "boolean" },
    ],
    triggerLinks: [
      { name: "Book consult", path: `/book/${niche.id}` },
      { name: "Review request", path: `/review/${niche.id}` },
      { name: "Reactivation offer", path: `/reactivate/${niche.id}` },
    ],
    centBudgetCap: {
      monthlyCapCents: ROI.centBudgetCap,
      alertAtCents: 1800,
      channels: ["sms", "voice"],
      quietHoursLocal: "08:00-20:00",
      note: "Hard stop so token and telephony COGS cannot dent the $1,500 retainer.",
    },
    calendar: {
      name: niche.slot.service,
      defaultSlot: niche.slot.when,
      duration: niche.slot.duration,
    },
  };
}

export function roiCalculator(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  const steps = [
    { name: "Import GHL snapshot, tags, and cent-budget cap", minutes: 4 },
    { name: "Paste Retell / Vapi agent, guardrails, and tools", minutes: 3 },
    { name: "Import n8n workflow and point the missed-call webhook", minutes: 5 },
    { name: "QA calendar hold, STOP keyword, and one test SMS", minutes: 4 },
  ];
  return {
    prospect: ctx.business,
    vertical: niche.vertical,
    economics: niche.economics,
    delivery: {
      minutes: steps.reduce((sum, step) => sum + step.minutes, 0),
      ceilingMinutes: ROI.deliveryCeilingMinutes,
      steps,
    },
    monthly: {
      tokenAndTelephonyCogsUsd: ROI.monthlyCogsUsd,
      breakdown: [
        { item: "LLM tokens for voice and SMS classification", usd: 6.4 },
        { item: "Inbound voice minutes", usd: 4.8 },
        { item: "A2P SMS segments", usd: 2.1 },
        { item: "n8n and GHL workflow overhead", usd: 0.9 },
      ],
      clientRetainerUsd: ROI.retainerUsd,
      grossMarginPct: ROI.grossMarginPct,
      formula: "(1500 - 14.20) / 1500 = 99.1%",
    },
    narrative: `${ctx.business} goes live in ${ROI.deliveryMinutes} minutes. Monthly delivery COGS stay at $14.20 against a $1,500 retainer, which is a 99.1% gross margin.`,
  };
}

export type Artifact = {
  id: "voice" | "n8n" | "ghl" | "roi";
  filename: string;
  title: string;
  description: string;
  document: unknown;
};

export function compilePack(ctx: ProspectContext) {
  const niche = getNiche(ctx.nicheId);
  const artifacts: Artifact[] = [
    {
      id: "voice",
      filename: "retell-vapi-voice-agent.json",
      title: "Retell / Vapi voice agent",
      description: "System prompt, hard guardrails, extraction schema, and tool definitions.",
      document: voiceAgent(ctx),
    },
    {
      id: "n8n",
      filename: "n8n-missed-call-workflow.json",
      title: "n8n automation workflow",
      description: "Missed-call webhook, idempotency, GHL upsert, SMS, then calendar booking.",
      document: n8nWorkflow(ctx),
    },
    {
      id: "ghl",
      filename: "ghl-snapshot-manifest.json",
      title: "GoHighLevel snapshot",
      description: "Pipeline stages, tags, custom fields, trigger links, and the cent-budget cap.",
      document: ghlManifest(ctx),
    },
    {
      id: "roi",
      filename: "roi-margin-calculator.json",
      title: "Client ROI and margin",
      description: "Delivery time, monthly COGS, retainer, and gross margin.",
      document: roiCalculator(ctx),
    },
  ];

  return {
    service: "lumina-nicheforge",
    compiledAt: new Date().toISOString(),
    prospect: {
      business: ctx.business,
      smsBrand: ctx.smsBrand,
      city: ctx.city,
      state: ctx.state,
      vertical: niche.vertical,
      nicheId: niche.id,
      economics: niche.economics,
    },
    citationPack: buildJsonLd({
      nicheId: niche.id,
      business: ctx.business,
      city: ctx.city,
      state: ctx.state,
    }),
    artifacts,
  };
}

export function packZip(ctx: ProspectContext) {
  const pack = compilePack(ctx);
  const files = pack.artifacts.map((artifact) => ({
    name: artifact.filename,
    data: encoder.encode(JSON.stringify(artifact.document, null, 2)),
  }));
  return {
    filename: `${slugify(ctx.business)}-nicheforge-pack.zip`,
    bytes: zipStore(files),
  };
}

export type FulfillmentPack = ReturnType<typeof compilePack>;
export type RoiDocument = ReturnType<typeof roiCalculator>;

export function contextFromNiche(nicheId: NicheId, business?: string, city?: string, state?: string): ProspectContext {
  const niche = getNiche(nicheId);
  const safeBusiness = business?.trim() || niche.business;
  return {
    nicheId,
    business: safeBusiness,
    smsBrand: liveBrand(nicheId, safeBusiness),
    city: city?.trim() || niche.city,
    state: state?.trim() || niche.state,
  };
}
