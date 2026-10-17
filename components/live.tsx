"use client";

import { createContext, useContext, useMemo } from "react";
import { splitCity } from "@/lib/http";
import { getNiche, type Niche, type NicheId } from "@/lib/niches";

export type LiveValue = {
  niche: Niche;
  business: string;
  smsBrand: string;
  city: string;
  state: string;
  cityLine: string;
};

const LiveContext = createContext<LiveValue | null>(null);

export function LiveProvider({
  nicheId,
  businessInput,
  cityInput,
  children,
}: {
  nicheId: NicheId;
  businessInput: string;
  cityInput: string;
  children: React.ReactNode;
}) {
  const value = useMemo<LiveValue>(() => {
    const niche = getNiche(nicheId);
    const business = businessInput.trim() || niche.business;
    const fallback = `${niche.city}, ${niche.state}`;
    const { city, state } = splitCity(cityInput.trim() || fallback, niche.state);
    const smsBrand = business === niche.business ? niche.smsBrand : business;
    return { niche, business, smsBrand, city, state, cityLine: `${city}, ${state}` };
  }, [nicheId, businessInput, cityInput]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive() {
  const value = useContext(LiveContext);
  if (!value) throw new Error("Live context missing");
  return value;
}
