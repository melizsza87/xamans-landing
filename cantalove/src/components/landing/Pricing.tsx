import Link from "next/link";
import { TIERS, formatMxn } from "@/lib/pricing";

const ORDER = ["basic", "premium"] as const;

export function Pricing() {
  return (
    <section id="precios" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-display text-3xl sm:text-4xl text-center text-text">
        Elige cómo quieres regalarla
      </h2>
      <p className="mt-3 text-center text-text-muted max-w-xl mx-auto">
        Escucha tu canción completa antes de decidir si quieres descargarla. Sin cargos sorpresa.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {ORDER.map((id) => {
          const tier = TIERS[id];
          const featured = id === "premium";
          return (
            <div
              key={id}
              className={`rounded-2xl border p-8 flex flex-col ${
                featured
                  ? "border-accent bg-surface/70 shadow-[0_0_40px_-12px_rgba(220,38,38,0.5)]"
                  : "border-white/10 bg-surface/40"
              }`}
            >
              {featured && (
                <span className="text-[11px] uppercase tracking-widest text-accent-soft font-semibold mb-3">
                  Más elegido
                </span>
              )}
              <h3 className="text-lg font-semibold text-text">{tier.name}</h3>
              <p className="mt-2 font-display text-4xl text-text">
                {formatMxn(tier.amountCents)}
                <span className="text-sm font-sans text-text-muted"> MXN</span>
              </p>
              <ul className="mt-6 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-text-muted flex items-center gap-2"
                  >
                    <span className="text-accent-soft">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/crear"
                className={`mt-8 inline-flex justify-center items-center rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                  featured
                    ? "bg-accent hover:bg-accent-soft text-text"
                    : "border border-white/20 hover:border-white/40 text-text"
                }`}
              >
                Empezar
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
