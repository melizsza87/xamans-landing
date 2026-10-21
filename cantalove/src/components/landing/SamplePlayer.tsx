"use client";

import { useEffect, useRef, useState } from "react";

const BAR_HEIGHTS = [
  20, 45, 30, 60, 40, 70, 35, 55, 25, 65, 45, 30, 50, 75, 40, 60, 30, 45, 55,
  35, 65, 40, 25, 50, 70, 45, 30, 60, 40, 55,
];

const SAMPLE_DURATION = 32; // seconds, simulated

export function SamplePlayer() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 1) {
            setPlaying(false);
            return 0;
          }
          return p + 1 / (SAMPLE_DURATION * 10);
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const elapsed = Math.round(progress * SAMPLE_DURATION);
  const activeBarIndex = Math.floor(progress * BAR_HEIGHTS.length);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-sm p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pausar ejemplo" : "Reproducir ejemplo"}
          className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-accent hover:bg-accent-soft transition-colors text-text"
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="1" width="4" height="14" rx="1" />
              <rect x="10" y="1" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 1.5v13l11-6.5-11-6.5z" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-[3px] h-10">
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${h}%`,
                  backgroundColor:
                    i <= activeBarIndex && playing
                      ? "var(--color-accent)"
                      : "rgba(249,250,251,0.25)",
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted font-sans">
            <span>&ldquo;Para Ana, en nuestro aniversario&rdquo;</span>
            <span>
              {String(Math.floor(elapsed / 60)).padStart(1, "0")}:
              {String(elapsed % 60).padStart(2, "0")} / 0:32
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-widest text-text-muted">
        Ejemplo ilustrativo — cada canción real se compone desde cero
      </p>
    </div>
  );
}
