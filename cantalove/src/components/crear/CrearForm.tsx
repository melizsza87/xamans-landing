"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type Brand = "love" | "heartbreak";
import { GENRES, VOICES, DURATIONS } from "@/lib/validation";
const MOODS = [
  ["Aniversario", "💌 Una historia de amor"],
  ["Boda", "🥂 Algo para celebrar"],
  ["Mamá o papá", "🌷 Dar las gracias"],
  ["Despecho", "🔥 Cerrar un capítulo"],
  ["Cumpleaños", "🎂 Un cumpleaños"],
  ["Otra ocasión", "✦ Algo diferente"],
];
const EMOTIONS = [
  "Emoción y ternura",
  "Alegría y celebración",
  "Nostalgia bonita",
  "Humor y picardía",
  "Despecho y liberación",
];
const STORE = "cantalove-draft-v1";
interface Draft {
  occasion: string;
  names: string;
  story: string;
  genre: string;
  voice: string;
  duration: string;
  email: string;
  vibe: string;
  requestId: string;
  orderId?: string;
  step: number;
}
async function api(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      result.error ||
        "No pudimos completar este paso. Tu historia sigue guardada; inténtalo más tarde.",
    );
  return result;
}

interface Props {
  brand?: Brand;
  initialOccasion?: string;
  onCancel?: () => void;
}
const subscribe = () => () => {};
export function CrearForm(props: Props) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted ? (
    <DraftForm key={props.brand || "love"} {...props} />
  ) : (
    <p className="help" role="status">
      Preparando tu historia…
    </p>
  );
}
function DraftForm({ brand = "love", initialOccasion, onCancel }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => {
    const initial: Draft = {
      occasion:
        initialOccasion || (brand === "love" ? "Aniversario" : "Despecho"),
      names: "",
      story: "",
      genre: brand === "love" ? "Balada pop" : "Corrido tumbado",
      voice: "Femenina",
      duration: "2:00 min",
      email: "",
      vibe: brand === "love" ? EMOTIONS[0] : EMOTIONS[4],
      requestId: crypto.randomUUID(),
      step: 0,
    };
    try {
      const saved = sessionStorage.getItem(STORE + ":" + brand);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Draft>;
        return {
          ...initial,
          ...parsed,
          requestId: parsed.requestId || initial.requestId,
          step: Math.max(0, Math.min(2, Number(parsed.step) || 0)),
        };
      }
    } catch {
      /* restore is optional */
    }
    return initial;
  });
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inflight = useRef(false);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE + ":" + brand, JSON.stringify(draft));
    } catch {
      /* Form remains usable when browser storage is unavailable. */
    }
  }, [draft, brand]);
  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  async function verifyEmail() {
    if (!draft.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setError("Escribe un correo válido para recibir tu código.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!sent) {
        await api("/api/auth/request", {
          email: draft.email.trim().toLowerCase(),
        });
        setSent(true);
        setMessage("Revisa tu correo e ingresa el código de verificación.");
      } else {
        await api("/api/auth/verify", {
          email: draft.email.trim().toLowerCase(),
          code,
        });
        setVerified(true);
        setMessage("Correo verificado. Ya puedes generar tu canción.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos verificar el correo.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (inflight.current) return;
    if (draft.step < 2) {
      if (
        draft.step === 1 &&
        (!draft.names.trim() || draft.story.trim().length < 20)
      ) {
        setError(
          "Cuéntanos para quién es y al menos un recuerdo de 20 caracteres.",
        );
        return;
      }
      update("step", draft.step + 1);
      return;
    }
    if (!verified || !consent) {
      setError(
        "Verifica tu correo y acepta los términos y el aviso de privacidad antes de continuar.",
      );
      return;
    }
    inflight.current = true;
    setBusy(true);
    setError("");
    let orderId = draft.orderId;
    try {
      if (!orderId) {
        setMessage("Componiendo la letra a partir de tu historia…");
        const result = await api("/api/generate-lyrics", {
          ...draft,
          brand,
          email: draft.email.trim().toLowerCase(),
          consent: true,
        });
        orderId = result.orderId;
        if (!orderId)
          throw new Error(
            "No pudimos recuperar el pedido. Tu historia sigue guardada.",
          );
        setDraft((current) => ({ ...current, orderId }));
        try {
          sessionStorage.setItem(
            STORE + ":" + brand,
            JSON.stringify({ ...draft, orderId }),
          );
        } catch {
          /* server idempotency preserves the order */
        }
      }
      setMessage(
        "Iniciando la producción musical. Esto puede tardar unos minutos…",
      );
      await api("/api/generate-song", { orderId });
      router.push(`/preview/${orderId}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos iniciar la canción.",
      );
      setMessage("Puedes volver a intentarlo: recuperaremos el mismo pedido.");
      setBusy(false);
      inflight.current = false;
    }
  }
  return (
    <form onSubmit={submit}>
      <span className="eyebrow">Diseña tu canción</span>
      {draft.orderId && (
        <p className="status-message">
          Ya tienes una canción en proceso.{" "}
          <Link href={`/preview/${draft.orderId}`}>Recuperar mi pedido ↗</Link>
        </p>
      )}
      <h2 id="modalTitle">
        {
          [
            "Empecemos por tu historia.",
            "Los detalles hacen la canción.",
            "Ahora dale su sonido.",
          ][draft.step]
        }
      </h2>
      <div className="progress" aria-label={`Paso ${draft.step + 1} de 3`}>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i <= draft.step ? "current" : ""} />
        ))}
      </div>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        {draft.step === 0 && (
          <div>
            <label>¿Qué te gustaría contar?</label>
            <div className="optgrid">
              {MOODS.map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  className={`opt ${draft.occasion === value ? "active" : ""}`}
                  aria-pressed={draft.occasion === value}
                  onClick={() => update("occasion", value)}
                >
                  {text}
                </button>
              ))}
            </div>
            {!MOODS.some(([value]) => value === draft.occasion) && (
              <p className="help" style={{ marginTop: 12 }}>
                Tu ocasión: {draft.occasion}
              </p>
            )}
          </div>
        )}
        {draft.step === 1 && (
          <div>
            <label htmlFor="names">¿Para quién es?</label>
            <input
              id="names"
              required
              maxLength={90}
              value={draft.names}
              autoComplete="off"
              placeholder="Ej. Fer, mi mamá, mi mejor amigo"
              onChange={(e) => update("names", e.target.value)}
            />
            <label htmlFor="story">Cuéntanos su historia</label>
            <textarea
              id="story"
              required
              minLength={20}
              maxLength={1800}
              value={draft.story}
              placeholder="¿Qué pasó? ¿Qué recuerdo no puede faltar? ¿Hay una frase que solo ustedes entienden?"
              onChange={(e) => update("story", e.target.value)}
            />
            <p className="help">
              Evita datos sensibles. Usaremos esta historia para componer tu
              canción con nuestros proveedores de inteligencia artificial.
            </p>
          </div>
        )}
        {draft.step === 2 && (
          <div>
            <label htmlFor="genre">¿Cómo quieres que suene?</label>
            <select
              id="genre"
              value={draft.genre}
              onChange={(e) => update("genre", e.target.value)}
            >
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <label htmlFor="vibe">¿Qué debería sentirse al escucharla?</label>
            <select
              id="vibe"
              value={draft.vibe}
              onChange={(e) => update("vibe", e.target.value)}
            >
              {EMOTIONS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <div className="field-row">
              <div>
                <label htmlFor="voice">Tipo de voz</label>
                <select
                  id="voice"
                  value={draft.voice}
                  onChange={(e) => update("voice", e.target.value)}
                >
                  {VOICES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="duration">Duración aproximada</label>
                <select
                  id="duration"
                  value={draft.duration}
                  onChange={(e) => update("duration", e.target.value)}
                >
                  {DURATIONS.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="help">
              La duración y la interpretación pueden variar. Escucha la canción
              completa antes de pagar.
            </p>
            <label htmlFor="email">Tu correo</label>
            <input
              id="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={draft.email}
              placeholder="tu@correo.com"
              onChange={(e) => {
                update("email", e.target.value);
                setVerified(false);
                setSent(false);
                setCode("");
                setMessage("");
              }}
            />
            {!verified && (
              <div className="verification">
                {sent && (
                  <>
                    <label htmlFor="code">Código de verificación</label>
                    <input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </>
                )}
                <button
                  className="outline"
                  type="button"
                  onClick={verifyEmail}
                  disabled={busy || (sent && code.length !== 6)}
                >
                  {sent ? "Verificar código" : "Enviar código a mi correo"}
                </button>
                {sent && (
                  <button
                    className="nav-switch"
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setCode("");
                      setMessage("");
                    }}
                  >
                    Cambiar o reenviar código
                  </button>
                )}
              </div>
            )}
            <label className="consent-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                He leído el{" "}
                <Link href="/privacidad" target="_blank">
                  aviso de privacidad
                </Link>{" "}
                y acepto los{" "}
                <Link href="/terminos" target="_blank">
                  términos
                </Link>
                . Tengo permiso para compartir esta historia y soy mayor de
                edad.
              </span>
            </label>
            <p className="help">
              Una generación gratuita por correo verificado. No necesitas
              tarjeta para escuchar.
            </p>
          </div>
        )}
      </fieldset>
      {message && (
        <p className="status-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button
          className="outline"
          type="button"
          disabled={busy}
          onClick={() => {
            if (draft.step > 0) update("step", draft.step - 1);
            else if (onCancel) onCancel();
            else router.push(brand === "love" ? "/" : "/rgas");
          }}
        >
          {draft.step === 0 ? "Cancelar" : "← Volver"}
        </button>
        <button
          className="solid"
          type="submit"
          disabled={busy || (draft.step === 2 && (!verified || !consent))}
        >
          {busy
            ? "Preparando tu canción…"
            : [
                "Continuar ↗",
                "Elegir sonido ↗",
                draft.orderId
                  ? "Recuperar mi canción ↗"
                  : "Generar mi canción ↗",
              ][draft.step]}
        </button>
      </div>
      <p className="help" style={{ marginTop: 18 }}>
        Tu borrador se conserva en esta pestaña. Bórralo al terminar si usas un
        dispositivo compartido.
      </p>
      <button
        type="button"
        className="nav-switch"
        disabled={busy}
        onClick={() => {
          try {
            sessionStorage.removeItem(STORE + ":" + brand);
          } catch {}
          setDraft((current) => ({
            ...current,
            names: "",
            story: "",
            email: "",
            orderId: undefined,
            requestId: crypto.randomUUID(),
            step: 0,
          }));
          setVerified(false);
          setSent(false);
          setConsent(false);
          setMessage("");
          setError("");
        }}
      >
        Borrar borrador
      </button>
    </form>
  );
}
