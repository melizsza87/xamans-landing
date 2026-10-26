"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
export default function Recover() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<
    { id: string; status: string; payment_status: string }[]
  >([]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${sent ? "verify" : "request"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const v = await response.json();
      if (!response.ok) throw new Error(v.error);
      if (!sent) {
        setSent(true);
        setMessage(v.message);
      } else {
        const r = await fetch("/api/orders");
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setOrders(data.orders);
        setMessage(
          data.orders.length
            ? "Estos son tus pedidos."
            : "No encontramos pedidos con este correo.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo recuperar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="wrap order-page">
      <Link className="logo" href="/">
        canta<b>love</b> ♡
      </Link>
      <h1>Tu historia sigue aquí.</h1>
      <p>
        Verifica el correo con el que creaste tu canción para recuperarla en
        cualquier dispositivo.
      </p>
      <form className="modal" onSubmit={submit}>
        <label htmlFor="email">Tu correo</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSent(false);
          }}
        />
        {sent && (
          <>
            <label htmlFor="code">Código de seis dígitos</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </>
        )}
        <button className="solid" disabled={busy}>
          {busy
            ? "Un momento…"
            : sent
              ? "Recuperar mis pedidos"
              : "Enviarme código"}
        </button>
        <p role="status">{message}</p>
      </form>
      {orders.map((o) => (
        <p key={o.id}>
          <Link
            className="outline"
            href={`${o.payment_status === "approved" ? "/descarga/" : "/preview/"}${o.id}`}
          >
            Abrir mi canción · {o.status}
          </Link>
        </p>
      ))}
    </main>
  );
}
