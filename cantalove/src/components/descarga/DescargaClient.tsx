"use client";
import { useEffect, useState } from "react";
export function DescargaClient({
  orderId,
  showLyricsPdf,
  paid,
}: {
  orderId: string;
  names?: string;
  showLyricsPdf: boolean;
  paid: boolean;
}) {
  const [error, setError] = useState("");
  useEffect(() => {
    if (paid) return;
    const timer = setInterval(() => {
      void fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((v) => {
          if (v.order?.payment_status === "approved") window.location.reload();
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(timer);
  }, [paid, orderId]);
  async function download(version: number) {
    try {
      const r = await fetch(`/api/download/${orderId}?version=${version}`);
      const value = await r.json();
      if (!r.ok) throw new Error(value.error);
      window.location.assign(value.downloadUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo descargar.");
    }
  }
  return (
    <div>
      {paid ? (
        <>
          {[0, 1].map((v) => (
            <button key={v} className="solid" onClick={() => download(v)}>
              Descargar versión {v + 1} · MP3
            </button>
          ))}
          {showLyricsPdf && (
            <a className="outline" href={`/api/download/${orderId}/lyrics`}>
              Descargar letra · PDF
            </a>
          )}
        </>
      ) : (
        <p role="status">
          Esperando la confirmación de Mercado Pago. Esta página revisa el
          estado automáticamente.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
