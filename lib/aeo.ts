import { fill } from "./http";
import { getNiche, type NicheId } from "./niches";

export type AeoReport = {
  query: string;
  citationScore: number;
  projectedScore: number;
  engines: {
    id: "chatgpt" | "perplexity" | "aio";
    name: string;
    cited: boolean;
    rank: number | null;
    answer: string;
  }[];
  gaps: { title: string; detail: string }[];
  reviewVelocity: { currentPerMonth: number; benchmarkPerMonth: number };
  jsonLd: Record<string, unknown>;
};

export function buildJsonLd(input: {
  nicheId: NicheId;
  business: string;
  city: string;
  state: string;
}) {
  const niche = getNiche(input.nicheId);
  const slug = input.business.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const services = niche.services.map((name) => ({
    "@type": niche.schemaType === "Dentist" || niche.schemaType === "MedicalClinic" ? "MedicalProcedure" : "Service",
    name,
  }));
  const type =
    niche.id === "hvac" ? ["HVACBusiness", "Plumber"] : niche.schemaType;

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: input.business,
    description: `${niche.vertical} serving ${input.city}, ${input.state}.`,
    url: `https://example.com/${slug || "clinic"}`,
    telephone: niche.trackingPhone,
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressRegion: input.state,
      addressCountry: "US",
    },
    areaServed: niche.neighborhoods.map((name) => fill(name, { city: input.city })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    makesOffer: services,
    keywords: fill(niche.queryTemplate, { city: input.city }),
  };
}

export function buildAeoReport(input: {
  nicheId: NicheId;
  business: string;
  city: string;
  state: string;
}): AeoReport {
  const niche = getNiche(input.nicheId);
  const vars = { business: input.business, city: input.city, state: input.state };
  const query = fill(niche.queryTemplate, vars);
  const neighborhoods = niche.neighborhoods.map((name) => fill(name, vars)).join(", ");

  return {
    query,
    citationScore: niche.citationScore,
    projectedScore: niche.projectedScore,
    reviewVelocity: {
      currentPerMonth: niche.reviewVelocity.current,
      benchmarkPerMonth: niche.reviewVelocity.benchmark,
    },
    engines: [
      {
        id: "chatgpt",
        name: "ChatGPT",
        cited: niche.engines.chatgpt.rank !== null && niche.engines.chatgpt.rank <= 3,
        rank: niche.engines.chatgpt.rank,
        answer: fill(niche.engines.chatgpt.answer, vars),
      },
      {
        id: "perplexity",
        name: "Perplexity",
        cited: niche.engines.perplexity.rank !== null && niche.engines.perplexity.rank <= 3,
        rank: niche.engines.perplexity.rank,
        answer: fill(niche.engines.perplexity.answer, vars),
      },
      {
        id: "aio",
        name: "Google AI Overviews",
        cited: niche.engines.aio.rank !== null && niche.engines.aio.rank <= 3,
        rank: niche.engines.aio.rank,
        answer: fill(niche.engines.aio.answer, vars),
      },
    ],
    gaps: [
      {
        title: `Missing ${niche.schemaType} JSON-LD`,
        detail: `The site has no ${niche.schemaType} entity, so answer engines cannot attach ${input.business} to the query.`,
      },
      {
        title: "Entity graph is thin",
        detail: `No practitioner or owner entity, and the service area omits ${neighborhoods}.`,
      },
      {
        title: "Review velocity gap",
        detail: `${niche.reviewVelocity.current.toFixed(1)} new reviews per month versus a ${niche.reviewVelocity.benchmark.toFixed(1)} local benchmark.`,
      },
      {
        title: "No answer-ready FAQ",
        detail: `Nothing on the site directly answers “${query}”.`,
      },
    ],
    jsonLd: buildJsonLd(input),
  };
}
