"use client";

import { useState } from "react";

interface DescargaClientProps {
  orderId: string;
  names: string;
  showLyricsPdf: boolean;
  showAlternate: boolean;
}

export function DescargaClient({
  orderId,
  names,
  showLyricsPdf,
  showAlternate,
}: DescargaClientProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [anonymousBusy, setAnonymousBusy] = useState(false);

  async function handleDownload(variant: "primary" | "alternate" = "primary") {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${orderId}${variant === "alternate" ? "?version=alternate" : ""}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "No se pudo generar la descarga");
      }
      const { downloadUrl } = await res.json();
      window.location.assign(downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo generar la descarga"
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Una canción para ${names}`,
          url,
        });
        return;
      } catch {
        // user cancelled — fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      setError("No se pudo copiar el enlace");
    }
  }

  async function shareAnonymously() {
    setError(null);
    setAnonymousBusy(true);
    try {
      const response = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "No se pudo preparar el enlace anónimo");
      }
      const { shareUrl } = await response.json();
      if (navigator.share) {
        try {
          await navigator.share({ title: "Te dedicaron una canción", text: "Hay una canción para ti. Escúchala aquí:", url: shareUrl });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo compartir");
    } finally {
      setAnonymousBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => handleDownload()}
        disabled={downloading}
        className="w-full inline-flex justify-center items-center rounded-full bg-accent hover:bg-accent-soft disabled:opacity-60 transition-colors px-8 py-4 text-base font-semibold text-text"
      >
        {downloading ? "Preparando descarga..." : "Descargar canción completa (MP3)"}
      </button>

      {showAlternate && (
        <button type="button" onClick={() => handleDownload("alternate")} disabled={downloading}
          className="w-full rounded-full border border-white/20 px-8 py-4 font-semibold text-text">
          Descargar segunda versión (MP3)
        </button>
      )}

      {showLyricsPdf && (
        <a
          href={`/api/download/${orderId}/lyrics`}
          className="w-full inline-flex justify-center items-center rounded-full border border-white/20 hover:border-white/40 transition-colors px-8 py-4 text-base font-semibold text-text"
        >
          Descargar letra (PDF)
        </a>
      )}

      <button
        type="button"
        onClick={handleShare}
        className="w-full inline-flex justify-center items-center rounded-full border border-white/20 hover:border-white/40 transition-colors px-8 py-4 text-base font-semibold text-text"
      >
        {shared ? "Enlace copiado" : "Compartir enlace privado"}
      </button>

      <section className="rounded-2xl border border-rose-300/25 bg-rose-200/10 px-5 py-5 text-left">
        <h2 className="font-semibold text-text">¿Quieres enviarla sin decir quién eres?</h2>
        <p className="mt-2 text-sm text-text-muted">Creamos un enlace anónimo para compartirlo tú por WhatsApp, mensaje o correo. No enviamos mensajes automáticos a otras personas.</p>
        <p className="mt-2 text-xs text-text-muted">Revisa la letra antes: podría revelar detalles de tu historia. No compartas contenido para acosar, amenazar o suplantar.</p>
        <button type="button" disabled={anonymousBusy} onClick={shareAnonymously}
          className="mt-4 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {anonymousBusy ? "Preparando enlace..." : shared ? "Enlace anónimo copiado" : "Enviar canción anónimamente"}
        </button>
      </section>

      {error && (
        <p className="text-center text-sm text-accent-soft">{error}</p>
      )}
    </div>
  );
}
