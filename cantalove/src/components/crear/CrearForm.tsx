"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const OCCASIONS = [
  "Despecho",
  "San Valentín",
  "Día de las Madres",
  "Boda/Vals",
  "XV Años",
  "Aniversario",
  "Cumpleaños",
  "Navidad",
  "Otro",
];

const GENRES = [
  "Bolero",
  "Balada pop",
  "Ranchera",
  "Cumbia",
  "Norteño",
  "Banda",
  "Mariachi",
  "Vals clásico",
  "Corrido tumbado",
  "Regional mexicano",
];

const VOICES = ["Femenina", "Masculina", "Dueto"];

const DURATIONS = ["1:30 min", "2:00 min", "2:30 min"];

const LOADING_MESSAGES = [
  "Componiendo la letra...",
  "Produciendo la música...",
  "Casi lista...",
];

const SONG_POLL_INTERVAL_MS = 5000;
const SONG_POLL_TIMEOUT_MS = 6 * 60 * 1000;
// After this many polls (~20s), switch the loading copy to "Casi lista...".
const ALMOST_READY_AFTER_TICKS = 4;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SongStatusResponse {
  status: "processing" | "ready" | "failed";
  audioUrl?: string;
  error?: string;
}

async function waitForSongReady(
  jobId: string,
  onTick: (ticks: number) => void
): Promise<void> {
  const deadline = Date.now() + SONG_POLL_TIMEOUT_MS;
  let ticks = 0;

  while (Date.now() < deadline) {
    await sleep(SONG_POLL_INTERVAL_MS);
    ticks += 1;
    onTick(ticks);

    const res = await fetch(`/api/song-status/${jobId}`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        body?.error || "No se pudo consultar el estado de la canción"
      );
    }

    const status = (await res.json()) as SongStatusResponse;
    if (status.status === "ready") return;
    if (status.status === "failed") {
      throw new Error("No se pudo generar la música, intenta de nuevo");
    }
  }

  throw new Error(
    "La generación está tardando más de lo esperado, intenta de nuevo en unos minutos"
  );
}

interface FormState {
  occasion: string;
  email: string;
  names: string;
  story: string;
  genre: string;
  voice: string;
  duration: string;
}

const INITIAL_STATE: FormState = {
  occasion: "Aniversario",
  email: "",
  names: "",
  story: "",
  genre: GENRES[0],
  voice: VOICES[0],
  duration: DURATIONS[0],
};

const selectClass =
  "w-full rounded-xl bg-surface/60 border border-white/15 px-4 py-3 text-text focus:outline-none focus:border-accent-soft transition-colors appearance-none";
const inputClass =
  "w-full rounded-xl bg-surface/60 border border-white/15 px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent-soft transition-colors";
const labelClass = "block text-sm font-medium text-text mb-2";

export function CrearForm({ initialOccasion = "Aniversario", enabled = true }: { initialOccasion?: string; enabled?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...INITIAL_STATE, occasion: initialOccasion });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    setLoadingStep(0);

    try {
      const lyricsRes = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!lyricsRes.ok) {
        const body = await lyricsRes.json().catch(() => null);
        throw new Error(body?.error || "No se pudo generar la letra");
      }

      const { orderId } = await lyricsRes.json();

      setLoadingStep(1);

      const songRes = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
        }),
      });

      if (!songRes.ok) {
        const body = await songRes.json().catch(() => null);
        throw new Error(body?.error || "No se pudo iniciar la generación de música");
      }

      const { jobId } = await songRes.json();

      await waitForSongReady(jobId, (ticks) => {
        if (ticks >= ALMOST_READY_AFTER_TICKS) setLoadingStep(2);
      });

      router.push(`/preview/${orderId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Algo salió mal generando tu canción, intenta de nuevo"
      );
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-12 w-12 rounded-full border-2 border-white/15 border-t-accent animate-spin" />
        <p className="mt-8 font-display text-2xl text-text">
          {LOADING_MESSAGES[loadingStep]}
        </p>
        <p className="mt-2 text-sm text-text-muted max-w-sm">
          Esto puede tardar unos minutos — estamos componiendo algo que sólo
          existirá para ustedes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass} htmlFor="email">Tu correo para recibir la canción</label>
        <input id="email" type="email" maxLength={254} autoComplete="email" required className={inputClass}
          placeholder="tu@correo.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <p className="mt-2 text-xs text-text-muted">Una generación gratuita por correo. Utilizaremos tu dirección para entregarte tu canción.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="occasion">
            Ocasión
          </label>
          <select
            id="occasion"
            className={selectClass}
            value={form.occasion}
            onChange={(e) => update("occasion", e.target.value)}
          >
            {OCCASIONS.map((o) => (
              <option key={o} value={o} className="bg-surface">
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="names">
            Nombres de las personas
          </label>
          <input
            id="names"
            className={inputClass}
            placeholder="Ej. Ana y Miguel"
            maxLength={120}
            value={form.names}
            onChange={(e) => update("names", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="story">
          Su historia
        </label>
        <textarea
          id="story"
          className={`${inputClass} min-h-[160px] resize-y`}
          placeholder="Cuéntanos su historia con el mayor detalle posible..."
          maxLength={1800}
          value={form.story}
          onChange={(e) => update("story", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="genre">
            Género musical
          </label>
          <select
            id="genre"
            className={selectClass}
            value={form.genre}
            onChange={(e) => update("genre", e.target.value)}
          >
            {GENRES.map((g) => (
              <option key={g} value={g} className="bg-surface">
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="voice">
            Voz
          </label>
          <select
            id="voice"
            className={selectClass}
            value={form.voice}
            onChange={(e) => update("voice", e.target.value)}
          >
            {VOICES.map((v) => (
              <option key={v} value={v} className="bg-surface">
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="duration">
            Duración
          </label>
          <select
            id="duration"
            className={selectClass}
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d} className="bg-surface">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-soft">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!enabled}
        className="w-full rounded-full bg-accent hover:bg-accent-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-8 py-4 text-base font-semibold text-text"
      >
        {enabled ? "Generar mi canción" : "Generación no disponible todavía"}
      </button>
    </form>
  );
}
