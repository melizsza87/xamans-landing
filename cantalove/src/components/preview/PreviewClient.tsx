"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TIERS, formatMxn } from "@/lib/pricing";
export function PreviewClient({
  orderId,
  names,
  lyrics,
  ready,
  jobId,
  failed,
  paymentStatus,
  brand,
}: {
  brand: string;
  orderId: string;
  names: string;
  lyrics: string;
  ready: boolean;
  jobId: string | null;
  failed: boolean;
  paymentStatus: string;
}) {
  const [state, setState] = useState(
    ready ? "ready" : failed ? "failed" : "processing",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (state !== "processing" || !jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch(`/api/song-status/${jobId}`);
        const value = await res.json();
        if (cancelled) return;
        if (res.ok && value.status === "ready") {
          window.location.reload();
          return;
        }
        if (value.status === "failed") {
          setState("failed");
          return;
        }
        if (!res.ok)
          setError(
            value.error ||
              "No pudimos consultar el proveedor. Volveremos a intentarlo.",
          );
        else setError("");
      } catch {
        if (!cancelled)
          setError("Se interrumpió la conexión. Tu pedido sigue guardado.");
      }
      if (!cancelled) timer = setTimeout(poll, 7000);
    }
    timer = setTimeout(poll, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state, jobId]);
  async function continueSong() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo continuar.");
      setBusy(false);
    }
  }
  async function checkout() {
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, tier: "premium" }),
      });
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      window.location.assign(v.checkoutUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el pago.");
      setBusy(false);
    }
  }
  return (
    <div className="wrap order-page">
      <span className="eyebrow">Tu historia hecha música</span>
      <h1>Para {names}</h1>
      {state === "ready" ? (
        <>
          <p>
            Escucha tus dos versiones completas gratis. Después decide si
            quieres descargarlas.
          </p>
          {[0, 1].map((version) => (
            <div className="step" key={version}>
              <h3>Versión {version + 1}</h3>
              <audio
                controls
                preload="none"
                controlsList="nodownload"
                src={`/api/listen/${orderId}?version=${version}`}
                onPlay={() =>
                  void fetch("/api/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "play", brand, orderId }),
                  })
                }
              />
            </div>
          ))}
          <details>
            <summary>Leer mi letra</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{lyrics}</pre>
          </details>
          <div className="price">
            <h2>
              {TIERS.premium.name} · {formatMxn(TIERS.premium.amountCents)} MXN
            </h2>
            <p>Dos versiones MP3 y tu letra en PDF.</p>
            {["paid", "delivered"].includes(paymentStatus) ? (
              <Link className="solid" href={`/descarga/${orderId}`}>
                Ir a mis descargas
              </Link>
            ) : (
              <button className="solid" onClick={checkout} disabled={busy}>
                {busy ? "Abriendo pago seguro…" : "Elegir Premium y pagar"}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h2>
            {state === "failed"
              ? "No pudimos completar la canción."
              : "Estamos creando tu canción."}
          </h2>
          <p>
            Tu pedido está guardado. Puedes volver con tu correo sin iniciar
            otra generación.
          </p>
          {!jobId && lyrics && state !== "failed" && (
            <button className="solid" disabled={busy} onClick={continueSong}>
              Continuar producción
            </button>
          )}
          <Link href="/recuperar">Recuperar pedido</Link>
        </>
      )}
      {paymentStatus === "pending" && (
        <p role="status">
          Tu pago está pendiente de confirmación. No necesitas volver a pagar.
        </p>
      )}
      {paymentStatus === "rejected" && (
        <p role="status">
          Mercado Pago rechazó el pago. Recupera tu pedido para revisar el
          estado.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
