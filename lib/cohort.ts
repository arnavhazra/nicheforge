import { getNiche, NICHES, type NicheId } from "./niches";

export type Outcome = "none" | "hot" | "price" | "timing" | "dnc";

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lastTouch: string;
  ageMonths: number;
  source: string;
  status: string;
  historicalQuoteUsd: number;
  outcome: Outcome;
  snippet: string;
  recoveredUsd: number;
};

export type Cohort = {
  nicheId: NicheId;
  total: number;
  leads: Lead[];
  summary: {
    replies: number;
    replyRate: number;
    booked: number;
    bookedLabel: string;
    pipeline: number;
    hot: number;
    price: number;
    timing: number;
    dnc: number;
  };
};

const FIRST = [
  "Maya", "Jordan", "Elena", "Marcus", "Priya", "Noah", "Ava", "Luis", "Hannah", "Owen",
  "Sofia", "Caleb", "Nora", "Andre", "Leah", "Jonah", "Camila", "Grace", "Felix", "Iris",
  "Hugo", "Ruby", "Miles", "Clara", "Adrian", "Piper", "Nico", "Willa", "Seth", "Jade",
  "Omar", "Freya", "Colin", "Amina", "Beau", "Lila", "Derek", "Sasha", "Ivan", "Tessa",
];

const LAST = [
  "Nguyen", "Patel", "Brooks", "Garcia", "Cohen", "Walsh", "Kim", "Reed", "Alvarez", "Shah",
  "Foster", "Bennett", "Owens", "Diaz", "Murphy", "Chambers", "Holt", "Silva", "Park", "Greene",
  "Ibarra", "Quinn", "Vogel", "Santos",
];

const SOURCES = ["Google Ads", "GBP call", "Website form", "Referral", "Facebook lead ad"];
const STATUSES = ["Quoted, no close", "No-show consult", "Missed call", "Form fill, cold", "Estimate expired"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0) * 17, 2166136261) >>> 0;
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isoDaysBefore(days: number) {
  const date = new Date(Date.UTC(2026, 9, 17));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function hotValue(nicheId: NicheId, hotIndex: number) {
  if (nicheId === "hvac") return hotIndex < 18 ? 890 : 8400;
  return getNiche(nicheId).ticketValue;
}

export function buildCohort(nicheId: NicheId): Cohort {
  const niche = getNiche(nicheId);
  const random = mulberry32(hashSeed(nicheId));
  const replies = niche.wave.hot + niche.wave.price + niche.wave.timing + niche.wave.dnc;
  const assignments: { outcome: Outcome; recoveredUsd: number; snippet: string }[] = [];

  const pushMany = (outcome: Outcome, count: number) => {
    for (let i = 0; i < count; i += 1) {
      const bank = outcome === "none" ? [] : niche.snippets[outcome];
      const recoveredUsd = outcome === "hot" ? hotValue(nicheId, assignments.filter((item) => item.outcome === "hot").length) : 0;
      assignments.push({
        outcome,
        recoveredUsd,
        snippet: outcome === "none" ? "" : bank[i % bank.length],
      });
    }
  };

  pushMany("hot", niche.wave.hot);
  pushMany("price", niche.wave.price);
  pushMany("timing", niche.wave.timing);
  pushMany("dnc", niche.wave.dnc);
  pushMany("none", 480 - replies);

  const order = shuffle(assignments, random);
  const leads: Lead[] = order.map((assignment, index) => {
    const firstName = FIRST[index % FIRST.length];
    const lastName = LAST[(index * 3) % LAST.length];
    const ageMonths = 6 + (index % 13);
    const quote = nicheId === "hvac" ? (index % 5 === 0 ? 8400 : 890) : niche.ticketValue;
    return {
      id: `${nicheId}-${String(index + 1).padStart(3, "0")}`,
      firstName,
      lastName,
      phone: `+1 (${niche.areaCode}) 555-${String(1000 + (index % 9000)).padStart(4, "0")}`,
      email: `${firstName}.${lastName}${index}@example.com`.toLowerCase(),
      lastTouch: isoDaysBefore(ageMonths * 30 + (index % 12)),
      ageMonths,
      source: SOURCES[index % SOURCES.length],
      status: STATUSES[index % STATUSES.length],
      historicalQuoteUsd: quote,
      outcome: assignment.outcome,
      snippet: assignment.snippet,
      recoveredUsd: assignment.recoveredUsd,
    };
  });

  const pipeline = leads.reduce((sum, lead) => sum + lead.recoveredUsd, 0);
  if (leads.length !== 480) throw new Error(`${nicheId} cohort must be 480`);
  if (pipeline !== niche.wave.pipeline) {
    throw new Error(`${nicheId} pipeline ${pipeline} != ${niche.wave.pipeline}`);
  }

  return {
    nicheId,
    total: 480,
    leads,
    summary: {
      replies,
      replyRate: Number(((replies / 480) * 100).toFixed(1)),
      booked: niche.wave.hot,
      bookedLabel: niche.wave.bookedLabel,
      pipeline,
      hot: niche.wave.hot,
      price: niche.wave.price,
      timing: niche.wave.timing,
      dnc: niche.wave.dnc,
    },
  };
}

export function cohortCsv(nicheId: NicheId, city: string) {
  const cohort = buildCohort(nicheId);
  const header = [
    "first_name",
    "last_name",
    "phone",
    "email",
    "city",
    "last_touch",
    "age_months",
    "source",
    "status",
    "historical_quote_usd",
  ];
  const lines = cohort.leads.map((lead) =>
    [
      lead.firstName,
      lead.lastName,
      lead.phone,
      lead.email,
      city,
      lead.lastTouch,
      String(lead.ageMonths),
      lead.source,
      lead.status,
      String(lead.historicalQuoteUsd),
    ]
      .map((cell) => `"${cell.replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

NICHES.forEach((niche) => buildCohort(niche.id));
