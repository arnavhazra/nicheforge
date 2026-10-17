export const NICHE_IDS = ["peptide", "medspa", "roofing", "dental", "hvac"] as const;

export type NicheId = (typeof NICHE_IDS)[number];

export type Objection = { label: string; text: string };

export type Niche = {
  id: NicheId;
  shortLabel: string;
  vertical: string;
  business: string;
  smsBrand: string;
  city: string;
  state: string;
  economics: string;
  ticketValue: number;
  areaCode: string;
  trackingPhone: string;
  prospectPhone: string;
  services: string[];
  schemaType: string;
  queryTemplate: string;
  citationScore: number;
  projectedScore: number;
  reviewVelocity: { current: number; benchmark: number };
  neighborhoods: string[];
  opener: string;
  objections: [Objection, Objection, Objection];
  answers: {
    price: string;
    financing: string;
    schedule: string;
    confirm: string;
    general: string;
    safety: string;
    optout: string;
  };
  safety: RegExp;
  slot: { when: string; service: string; duration: string };
  wave: {
    hot: number;
    price: number;
    timing: number;
    dnc: number;
    bookedLabel: string;
    pipeline: number;
  };
  snippets: Record<"hot" | "price" | "timing" | "dnc", string[]>;
  engines: {
    chatgpt: { rank: number | null; answer: string };
    perplexity: { rank: number | null; answer: string };
    aio: { rank: number | null; answer: string };
  };
};

export function isNicheId(value: string): value is NicheId {
  return (NICHE_IDS as readonly string[]).includes(value);
}

const peptideSafety =
  /\b(dose|dosing|units|reconstitut|protocol|\d+\s?mg|semaglutide|tirzepatide|research chemical|where (can|do) i (buy|get))\b/i;

export const NICHES: Niche[] = [
  {
    id: "peptide",
    shortLabel: "Peptide",
    vertical: "Peptide & Longevity Telehealth Clinic",
    business: "Apex Peptide & Vitality",
    smsBrand: "Apex Peptide Clinic",
    city: "Scottsdale",
    state: "AZ",
    economics: "$1,850 avg patient LTV",
    ticketValue: 1850,
    areaCode: "480",
    trackingPhone: "+1 (480) 555-0108",
    prospectPhone: "+1 (480) 555-0142",
    services: [
      "Longevity bloodwork panel",
      "Provider peptide consult",
      "Hormone and metabolic review",
    ],
    schemaType: "MedicalClinic",
    queryTemplate: "best peptide therapy clinic in {city} with bloodwork",
    citationScore: 22,
    projectedScore: 78,
    reviewVelocity: { current: 1.1, benchmark: 7.5 },
    neighborhoods: ["Old Town", "DC Ranch", "Paradise Valley"],
    opener:
      "Hey {first}, saw we just missed your call at {smsBrand}! Are you looking to book a BPC-157 / Longevity panel or speaking with a provider?",
    objections: [
      { label: "Bloodwork price", text: "How much is initial bloodwork?" },
      { label: "HSA / FSA", text: "Do you take HSA/FSA?" },
      { label: "Thursday afternoon", text: "Can I come in Thursday afternoon?" },
    ],
    answers: {
      price:
        "Initial bloodwork at {smsBrand} is $249 and is HSA/FSA eligible. It maps hormones, inflammation, and metabolic markers before any protocol. The provider consult is $150 and is credited if you start care. Want Thursday at 2:40 PM?",
      financing:
        "Yes. Bloodwork and the provider consult at {smsBrand} can be paid with HSA/FSA. I can't quote a medication protocol over text — that stays with the licensed provider. I can hold Thursday 2:40 PM in {city}.",
      schedule:
        "Thursday 2:40 PM is open for a new-patient longevity consult at {smsBrand} in {city}. I'm writing {prospect} onto the calendar and tagging the GoHighLevel contact booked-consult. You'll get a confirmation text — reply CHANGE if you need another time.",
      confirm:
        "Locked. Thursday 2:40 PM at {smsBrand}, {city}. {prospect} is tagged booked-consult in GoHighLevel. We'll text a reminder that morning. The provider will review labs with you — I won't advise a protocol over SMS.",
      general:
        "Happy to help. Are you hoping to book the longevity bloodwork panel, or do you want a provider consult first at {smsBrand}?",
      safety:
        "I can't advise on dosing, sourcing, or whether a peptide is appropriate — that has to come from the licensed provider after bloodwork. I can hold Thursday 2:40 PM at {smsBrand} in {city} so they can review it with you.",
      optout:
        "You're unsubscribed. I tagged this contact DNC in GoHighLevel and suppressed future SMS from {smsBrand}. We won't text this number again.",
    },
    safety: peptideSafety,
    slot: {
      when: "Thursday 2:40 PM",
      service: "New-patient longevity consult",
      duration: "30 min",
    },
    wave: { hot: 19, price: 27, timing: 14, dnc: 8, bookedLabel: "19 booked consults", pipeline: 35150 },
    snippets: {
      hot: ["Thursday works for me", "Book the bloodwork", "Yes, hold 2:40"],
      price: ["How much is the panel?", "Is the consult extra?", "What's the cash price?"],
      timing: ["After my trip", "Ping me next month", "Not until January"],
      dnc: ["Stop", "Remove me", "Do not text"],
    },
    engines: {
      chatgpt: {
        rank: null,
        answer:
          "ChatGPT cites Sonoran Vitality Lounge and a national telehealth brand. {business} is not named, and the answer never mentions on-site bloodwork in {city}.",
      },
      perplexity: {
        rank: 9,
        answer:
          "Perplexity lists eight {city} longevity clinics from directory scrapes. {business} appears as an uncited footer link with no practitioner entity and no service schema.",
      },
      aio: {
        rank: null,
        answer:
          "Google AI Overviews answers with a generic 'talk to your physician' box. No local clinic is cited for bloodwork-backed peptide care in {city}.",
      },
    },
  },
  {
    id: "medspa",
    shortLabel: "Med Spa",
    vertical: "Medical Spa & Aesthetics",
    business: "Aura MedSpa & Laser",
    smsBrand: "Aura MedSpa",
    city: "Miami",
    state: "FL",
    economics: "$1,200 avg package value",
    ticketValue: 1200,
    areaCode: "305",
    trackingPhone: "+1 (305) 555-0160",
    prospectPhone: "+1 (305) 555-0174",
    services: ["Laser resurfacing package", "Injectable consult", "New-client skin analysis"],
    schemaType: "HealthAndBeautyBusiness",
    queryTemplate: "best laser medspa in {city} for melasma",
    citationScore: 31,
    projectedScore: 82,
    reviewVelocity: { current: 2.4, benchmark: 11 },
    neighborhoods: ["Brickell", "Coral Gables", "Wynwood"],
    opener:
      "Hey {first}, we just missed your call at {smsBrand}! Were you looking at a laser package, injectables, or a new-client consult in {city}?",
    objections: [
      { label: "Package price", text: "How much is a laser package?" },
      { label: "Financing", text: "Do you offer financing?" },
      { label: "Thursday afternoon", text: "Can I come in Thursday afternoon?" },
    ],
    answers: {
      price:
        "Laser packages at {smsBrand} start at $1,200, which is the average package our {city} clients book. The new-client skin analysis is complimentary this week. I don't quote injectable units over text. Thursday 2:40 PM is open if you want the analysis first.",
      financing:
        "Yes. Packages at $1,200 and up can use CareCredit or a 6-month in-house plan. I'll have the front desk show the payment options at the visit — I won't run a credit pull over SMS. Should I hold Thursday 2:40 PM?",
      schedule:
        "Thursday 2:40 PM is open for a new-client aesthetic consult at {smsBrand} in {city}. I'm booking {prospect} and tagging the GoHighLevel contact booked-consult. Reply CHANGE if you need a different chair time.",
      confirm:
        "Locked. Thursday 2:40 PM at {smsBrand}, {city}. {prospect} is tagged booked-consult. Come with a clean face if you want the skin analysis — your provider will confirm any treatment that day.",
      general:
        "Are you asking about laser for pigment, or a broader injectable consult at {smsBrand}?",
      safety:
        "I can't recommend units, diagnose a pigment condition, or promise a clearance result over text. A licensed provider at {smsBrand} has to see you. Thursday 2:40 PM is the next consult in {city}.",
      optout:
        "You're unsubscribed. I tagged this contact DNC in GoHighLevel and stopped the {smsBrand} sequence. We won't text this number again.",
    },
    safety: /\b(how many units|syringe|vascular occlusion|diagnose|promise.*(clear|gone)|prescription)\b/i,
    slot: { when: "Thursday 2:40 PM", service: "New-client aesthetic consult", duration: "45 min" },
    wave: { hot: 22, price: 28, timing: 16, dnc: 8, bookedLabel: "22 booked consults", pipeline: 26400 },
    snippets: {
      hot: ["Thursday after work", "Book the laser consult", "Yes hold a chair"],
      price: ["How much is the package?", "Is the consult free?", "What's the laser price?"],
      timing: ["After Art Basel", "Next month is better", "I'm traveling"],
      dnc: ["Stop", "Wrong number", "Unsubscribe"],
    },
    engines: {
      chatgpt: {
        rank: null,
        answer:
          "ChatGPT recommends Brickell Glow Room and a hotel spa. {business} is missing, so the melasma query never reaches a medical director or a device list.",
      },
      perplexity: {
        rank: 6,
        answer:
          "Perplexity cites a Yelp cluster for {city} laser clinics. {business} shows as a bare name with no FAQ answers and no HealthAndBeautyBusiness schema.",
      },
      aio: {
        rank: 8,
        answer:
          "Google AI Overviews pulls two directory cards. {business} is not one of them. The overview links a competitor review thread instead.",
      },
    },
  },
  {
    id: "roofing",
    shortLabel: "Roofing",
    vertical: "Storm Restoration & Commercial Roofing",
    business: "RidgeLine Roofing",
    smsBrand: "RidgeLine Roofing",
    city: "Dallas",
    state: "TX",
    economics: "$14,500 avg replacement ticket",
    ticketValue: 14500,
    areaCode: "214",
    trackingPhone: "+1 (214) 555-0188",
    prospectPhone: "+1 (214) 555-0196",
    services: ["Storm damage inspection", "Insurance photo pack", "Full roof replacement"],
    schemaType: "RoofingContractor",
    queryTemplate: "storm damage roofing contractor {city} insurance claims",
    citationScore: 18,
    projectedScore: 74,
    reviewVelocity: { current: 0.8, benchmark: 6 },
    neighborhoods: ["Highland Park", "Uptown", "Plano"],
    opener:
      "Hey {first}, {smsBrand} just missed your call. Is this about storm damage, an active leak, or a full replacement estimate in {city}?",
    objections: [
      { label: "Insurance", text: "Will insurance cover the roof?" },
      { label: "Emergency tarp", text: "How fast can you tarp it?" },
      { label: "Thursday afternoon", text: "Can someone come Thursday afternoon?" },
    ],
    answers: {
      price:
        "A typical full replacement with {smsBrand} in {city} runs about $14,500, confirmed after we measure. The storm inspection is no-cost. I can't promise what the carrier will approve. Thursday 2:40 PM is open for the inspection.",
      financing:
        "We document photos, measurements, and code items for the claim. The carrier decides coverage and the deductible — {smsBrand} does not guarantee approval. If you want that file started, I can put an inspector on Thursday 2:40 PM.",
      schedule:
        "Thursday 2:40 PM is open for a storm inspection with {smsBrand} in {city}. I'm booking {prospect} and tagging the GoHighLevel contact booked-inspection. If the roof is actively leaking, reply LEAK and I'll flag dispatch.",
      confirm:
        "Locked. Thursday 2:40 PM inspection with {smsBrand} in {city}. {prospect} is tagged booked-inspection in GoHighLevel. The rep will text on the way. We still don't promise a coverage decision.",
      general:
        "Is this an active leak, hail from the last storm, or a replacement you already know you need?",
      safety:
        "I can't tell you a claim will be approved, and I won't walk you through abatement on a text line. A RidgeLine inspector has to get on the roof. Thursday 2:40 PM is the next {city} slot.",
      optout:
        "You're unsubscribed. I tagged this contact DNC in GoHighLevel and pulled {prospect} out of the storm sequence. We won't text this number again.",
    },
    safety: /\b(guarantee.*(coverage|approval)|full coverage guaranteed|asbestos removal steps|how do i remove asbestos)\b/i,
    slot: { when: "Thursday 2:40 PM", service: "Storm inspection", duration: "45 min on site" },
    wave: { hot: 9, price: 16, timing: 10, dnc: 6, bookedLabel: "9 booked inspections", pipeline: 130500 },
    snippets: {
      hot: ["Thursday inspection works", "Come look at the hail", "Book the estimate"],
      price: ["What's a replacement run?", "Is the inspection free?", "Deductible question"],
      timing: ["After the adjuster", "Next week is better", "Call me Monday"],
      dnc: ["Stop", "Sold the house", "Remove me"],
    },
    engines: {
      chatgpt: {
        rank: null,
        answer:
          "ChatGPT names Trinity Hail Roof Co. and a national storm franchise. {business} is absent, so the insurance-claim query never surfaces the {city} crew.",
      },
      perplexity: {
        rank: null,
        answer:
          "Perplexity cites two Angi profiles and a news recap of the last hail cell. No RoofingContractor schema, so {business} is not in the source list.",
      },
      aio: {
        rank: 7,
        answer:
          "Google AI Overviews shows a map pack and then a generic claim checklist. {business} is below the overview, with no FAQ on storm inspections.",
      },
    },
  },
  {
    id: "dental",
    shortLabel: "Implants",
    vertical: "Full-Arch Implant Dental",
    business: "ClearSmile Implant Center",
    smsBrand: "ClearSmile Implant Center",
    city: "Austin",
    state: "TX",
    economics: "$22,000 avg case value",
    ticketValue: 22000,
    areaCode: "512",
    trackingPhone: "+1 (512) 555-0120",
    prospectPhone: "+1 (512) 555-0138",
    services: ["Full-arch consult", "CBCT records visit", "Second-opinion review"],
    schemaType: "Dentist",
    queryTemplate: "full arch dental implants {city} same week consult",
    citationScore: 27,
    projectedScore: 80,
    reviewVelocity: { current: 1.6, benchmark: 9 },
    neighborhoods: ["Westlake", "The Domain", "Round Rock"],
    opener:
      "Hey {first}, {smsBrand} missed your call. Are you looking at a full-arch consult or a second opinion on implants in {city}?",
    objections: [
      { label: "Case price", text: "How much is a full-arch case?" },
      { label: "CareCredit", text: "Do you work with CareCredit?" },
      { label: "Thursday afternoon", text: "Can I come in Thursday afternoon?" },
    ],
    answers: {
      price:
        "Full-arch cases at {smsBrand} average $22,000, confirmed in writing after records — I won't lock a clinical fee over text. The consult with CBCT is $149 and is credited if you proceed. Thursday 2:40 PM is open in {city}.",
      financing:
        "Yes, {smsBrand} works with CareCredit and a staged plan on treatment. Financing is offered after the doctor reviews the scan, not from this text thread. I can hold Thursday 2:40 PM for records.",
      schedule:
        "Thursday 2:40 PM is open for a full-arch records consult at {smsBrand} in {city}. I'm booking {prospect} and tagging the GoHighLevel contact booked-consult. Reply CHANGE if you need a different time.",
      confirm:
        "Locked. Thursday 2:40 PM at {smsBrand}, {city}. {prospect} is tagged booked-consult in GoHighLevel. Bring a photo ID. The doctor will review the scan before anyone quotes a final case fee.",
      general:
        "Are you replacing a denture, or is this a second opinion on a treatment plan you already have?",
      safety:
        "I can't diagnose bone, promise a smile outcome, or discuss sedation dosing over SMS. The doctor at {smsBrand} has to see the scan. Thursday 2:40 PM is open in {city}.",
      optout:
        "You're unsubscribed. I tagged this contact DNC in GoHighLevel and stopped texts from {smsBrand}. We won't message this number again.",
    },
    safety: /\b(sedation dose|bone graft protocol|diagnose|guarantee.*(smile|success|teeth))\b/i,
    slot: { when: "Thursday 2:40 PM", service: "Full-arch records consult", duration: "60 min" },
    wave: { hot: 7, price: 14, timing: 9, dnc: 6, bookedLabel: "7 booked case consults", pipeline: 154000 },
    snippets: {
      hot: ["Thursday consult works", "I want the second opinion", "Book the CBCT"],
      price: ["What's a full arch run?", "Is the consult credited?", "Case fee question"],
      timing: ["After the new year", "Need to check work", "Call next week"],
      dnc: ["Stop", "Not interested", "Remove me"],
    },
    engines: {
      chatgpt: {
        rank: null,
        answer:
          "ChatGPT sends the full-arch query to Hill Country Arch Studio and a dental-school clinic. {business} is not mentioned, and same-week consult availability is missing.",
      },
      perplexity: {
        rank: 8,
        answer:
          "Perplexity cites a local magazine list. {business} is a name-only bullet with no Dentist schema, no CBCT mention, and no provider entity.",
      },
      aio: {
        rank: null,
        answer:
          "Google AI Overviews explains the procedure in general and cites a national advertiser. No {city} implant center, including {business}, is quoted.",
      },
    },
  },
  {
    id: "hvac",
    shortLabel: "HVAC",
    vertical: "High-Volume HVAC & Plumbing",
    business: "MetroFlow Home Services",
    smsBrand: "MetroFlow",
    city: "Phoenix",
    state: "AZ",
    economics: "$890 emergency dispatch + $8,400 system install",
    ticketValue: 890,
    areaCode: "602",
    trackingPhone: "+1 (602) 555-0104",
    prospectPhone: "+1 (602) 555-0115",
    services: ["Emergency no-cool dispatch", "System replacement", "Plumbing triage"],
    schemaType: "HVACBusiness",
    queryTemplate: "emergency AC repair {city} same day",
    citationScore: 24,
    projectedScore: 76,
    reviewVelocity: { current: 3.1, benchmark: 14 },
    neighborhoods: ["Arcadia", "Biltmore", "North {city}"],
    opener:
      "Hey {first}, {smsBrand} just missed you. Is this an emergency no-cool, or are you pricing a system replacement in {city}?",
    objections: [
      { label: "Dispatch price", text: "How much is an after-hours dispatch?" },
      { label: "System financing", text: "Do you finance a full system?" },
      { label: "Thursday afternoon", text: "Can a tech come Thursday afternoon?" },
    ],
    answers: {
      price:
        "After-hours dispatch with {smsBrand} is $890 and is credited toward the repair if you approve the work. A full system install averages $8,400. Thursday 2:40 PM is a standard window, not an after-hours rate. Want me to hold it?",
      financing:
        "System installs around $8,400 can be financed on an 18-month plan after the tech confirms the equipment. I won't run credit over text. The dispatch fee is due at the visit. Thursday 2:40–4:40 PM is open in {city}.",
      schedule:
        "Thursday 2:40–4:40 PM is open for a tech window with {smsBrand} in {city}. I'm booking {prospect} and tagging the GoHighLevel contact booked-dispatch. Reply NO-COOL if the house is already hot and I'll flag priority.",
      confirm:
        "Locked. Thursday 2:40–4:40 PM arrival window with {smsBrand} in {city}. {prospect} is tagged booked-dispatch in GoHighLevel. The tech will text on the way. If this becomes an after-hours emergency, the dispatch fee is $890.",
      general:
        "Is the system blowing warm air right now, or are you comparing replacement quotes?",
      safety:
        "Don't add refrigerant yourself, and don't bypass a safety switch. If you smell gas or suspect carbon monoxide, leave the house and call emergency services. For a normal no-cool, I can still hold the Thursday window with {smsBrand}.",
      optout:
        "You're unsubscribed. I tagged this contact DNC in GoHighLevel and stopped {smsBrand} texts. We won't message this number again.",
    },
    safety: /\b(add refrigerant|recharge it yourself|bypass the (safety|switch)|carbon monoxide)\b/i,
    slot: {
      when: "Thursday 2:40–4:40 PM",
      service: "Tech arrival window",
      duration: "2 hr window",
    },
    wave: { hot: 24, price: 31, timing: 16, dnc: 8, bookedLabel: "24 booked jobs", pipeline: 66420 },
    snippets: {
      hot: ["Thursday window works", "No cool since noon", "Book the replacement quote"],
      price: ["What's after-hours cost?", "Finance a new system?", "Dispatch fee?"],
      timing: ["Next week is fine", "After payday", "Call Friday"],
      dnc: ["Stop", "Wrong number", "Do not call"],
    },
    engines: {
      chatgpt: {
        rank: null,
        answer:
          "ChatGPT recommends Desert Air Dispatch and a big-box home warranty. {business} is missing from same-day AC repair in {city}.",
      },
      perplexity: {
        rank: 5,
        answer:
          "Perplexity cites a map pack. {business} is an uncited listing with no HVACBusiness schema and no emergency FAQ, so the model skips it.",
      },
      aio: {
        rank: null,
        answer:
          "Google AI Overviews answers 'expect a $150 diagnostic' from a national article. It does not name {business} or a real {city} dispatch fee.",
      },
    },
  },
];

const byId = new Map(NICHES.map((niche) => [niche.id, niche]));

export function getNiche(id: NicheId) {
  const niche = byId.get(id);
  if (!niche) throw new Error(`Unknown niche: ${id}`);
  return niche;
}

export const PILLAR_COUNT = 4;
