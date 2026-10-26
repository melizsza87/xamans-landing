import type { Metadata } from "next";
import { CreatePageClient } from "@/components/crear/CreatePageClient";
export const metadata: Metadata = { title: "Crea tu canción — cantalove" };
export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const search = await searchParams;
  return (
    <CreatePageClient
      brand={search.brand === "heartbreak" ? "heartbreak" : "love"}
    />
  );
}
