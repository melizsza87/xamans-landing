import type { Tier } from "@/lib/types";

interface TierInfo {
  id: Tier;
  name: string;
  amountCents: number;
  features: string[];
}

// Amounts in centavos MXN — the source of truth used both by the pricing UI
// and by /api/checkout, so the client can never spoof a price.
export const TIERS: Record<Tier, TierInfo> = {
  basic: {
    id: "basic",
    name: "Básico",
    amountCents: 24900,
    features: ["Instrumental", "1 versión", "MP3"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    amountCents: 44900,
    features: ["Con letra personalizada", "2 versiones", "MP3 + PDF letra"],
  },
  vip: {
    id: "vip",
    name: "VIP",
    amountCents: 89900,
    features: ["Paquete pendiente de definición y validación"],
  },
};

export function formatMxn(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
