"use client";

import { useRef, useState } from "react";
import { TIERS, formatMxn } from "@/lib/pricing";
import type { Tier } from "@/lib/types";

const TIER_ORDER: Tier[] = ["basic", "premium"];

interface PreviewClientProps {
  orderId: string;
  previewUrl: string;
  lyrics: string;
  names: string;
}

export function PreviewClient({
  orderId,
  previewUrl,
  lyrics,
  names,
}: PreviewClientProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectingTier, setSelectingTier] = useState<Tier | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setElapsed(audio.currentTime);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  async function selectTier(tier: Tier) {
    setCheckoutError(null);
    setSelectingTier(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, tier }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "No se pudo iniciar el pago");
      }
      const { checkoutUrl } = await res.json();
      window.location.assign(checkoutUrl);
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "No se pudo iniciar el pago"
      );
      setSelectingTier(null);
    }
  }

  const progressPct = Math.min(100, (elapsed / (audioRef.current?.duration || 1)) * 100);

  return (
    <div className="space-y-16">
      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-accent-soft font-semibold text-center">
          Tu canción está lista
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-center text-text">
          Para {names}
        </h1>

        <div className="mt-10 rounded-2xl border border-white/10 bg-surface/50 p-6 sm:p-8">
          <audio
            ref={audioRef}
            src={previewUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pausar" : "Reproducir"}
              className="shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-accent hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text"
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="1" width="4" height="14" rx="1" />
                  <rect x="10" y="1" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3 1.5v13l11-6.5-11-6.5z" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-text-muted">
                <span>{Math.floor(elapsed)}s</span>
                <span>Escucha completa gratis</span>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs text-text-muted">La reproducción es gratuita. Si quieres conservar el MP3, elige un paquete abajo.</p>
        </div>

        <details className="mt-8 rounded-2xl border border-white/10 bg-surface/30 p-6 sm:p-8">
          <summary className="cursor-pointer font-display text-xl text-text">
            Ver letra
          </summary>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-text-muted leading-relaxed">
            {lyrics}
          </pre>
        </details>
      </section>

      <section>
        <h2 className="font-display text-2xl sm:text-3xl text-center text-text">
          ¿Quieres llevarte tu canción?
        </h2>
        {checkoutError && (
          <p className="mt-4 text-center text-sm text-accent-soft">
            {checkoutError}
          </p>
        )}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {TIER_ORDER.map((id) => {
            const tier = TIERS[id];
            const featured = id === "premium";
            const isSelecting = selectingTier === id;
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
                <h3 className="text-lg font-semibold text-text">
                  {tier.name}
                </h3>
                <p className="mt-2 font-display text-4xl text-text">
                  {formatMxn(tier.amountCents)}
                  <span className="text-sm font-sans text-text-muted">
                    {" "}
                    MXN
                  </span>
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
                <button
                  type="button"
                  onClick={() => selectTier(id)}
                  disabled={selectingTier !== null}
                  className={`mt-8 inline-flex justify-center items-center rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    featured
                      ? "bg-accent hover:bg-accent-soft text-text"
                      : "border border-white/20 hover:border-white/40 text-text"
                  }`}
                >
                  {isSelecting ? "Redirigiendo..." : "Elegir " + tier.name}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
