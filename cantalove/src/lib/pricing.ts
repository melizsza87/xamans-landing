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
    features: ["Canción cantada personalizada", "1 versión", "Archivo MP3"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    amountCents: 44900,
    features: ["Letra personalizada", "2 versiones musicales", "2 MP3 + PDF de letra"],
  },
  vip: {
    id: "vip",
    name: "VIP",
    amountCents: 89900,
    features: ["Disponible próximamente"],
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
