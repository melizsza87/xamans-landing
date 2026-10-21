import type { Metadata } from "next";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { CrearForm } from "@/components/crear/CrearForm";

export const metadata: Metadata = {
  title: "Crea tu canción — cantalove",
};

export default function CrearPage() {
  return (
    <div className="flex flex-col flex-1">
      <Nav />
      <main className="flex-1 bg-noise">
        <div className="mx-auto max-w-2xl px-6 pt-32 pb-24">
          <p className="text-xs uppercase tracking-[0.25em] text-accent-soft font-semibold text-center">
            Paso 1 de 2
          </p>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl text-center text-text">
            Cuéntanos de ese corazón roto
          </h1>
          <p className="mt-3 text-center text-text-muted">
            Convierte la anécdota, el coraje o la despedida en una canción que puedas cantar.
          </p>

          <div className="mt-12 rounded-2xl border border-white/10 bg-surface/40 p-6 sm:p-10">
            <CrearForm initialOccasion="Despecho" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
