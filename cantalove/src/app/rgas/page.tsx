import type { Metadata } from "next";
import { BrandLanding } from "@/components/landing/BrandLanding";
export const metadata: Metadata = { title: "Cantalovergas | Que suene fuerte" };
export default function RgasPage() {
  return <BrandLanding initialBrand="heartbreak" />;
}
