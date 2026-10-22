"use client";
import { CrearForm, type Brand } from "./CrearForm";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
export function CreatePageClient({ brand = "love" }: { brand?: Brand }) {
  return (
    <div
      className={`brand-shell ${brand === "heartbreak" ? "heartbreak" : ""}`}
    >
      <Nav brand={brand} />
      <main className="wrap form-page" id="inicio">
        <div className="modal">
          <CrearForm brand={brand} />
        </div>
      </main>
      <Footer brand={brand} />
    </div>
  );
}
