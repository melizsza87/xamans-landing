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

      {error && (
        <p className="text-center text-sm text-accent-soft">{error}</p>
      )}
    </div>
  );
}
