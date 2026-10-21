import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyWebhookSignature, fetchPayment } from "@/lib/mercadopago";
import { sendDeliveryEmail } from "@/lib/resend";

export const maxDuration = 60;

function allowedAudioUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.port) return false;
    const host = parsed.hostname.toLowerCase();
    const roots = ["suno.ai", "apiframe.ai"];
    const extras = (process.env.AUDIO_HOST_ALLOWLIST || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    return [...roots, ...extras].some(base => host === base || host.endsWith("." + base));
  } catch { return false; }
}

async function storeTrack(url: string, orderId: string, variant: "primary" | "alternate") {
  if (!allowedAudioUrl(url)) throw new Error("El proveedor devolvió una URL de audio no autorizada");
  const res = await fetch(url, { signal: AbortSignal.timeout(25000), redirect: "error" });
  if (!res.ok) throw new Error("No se pudo recuperar el audio");
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > 30 * 1024 * 1024) throw new Error("Archivo de audio demasiado grande");
  const path = orderId + "-" + variant + ".mp3";
  const { error } = await supabaseAdmin().storage.from("tracks").upload(path, bytes, {
    contentType: "audio/mpeg", upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: { type?: string; data?: { id?: string } } = {};
  try { body = await request.json(); } catch { /* empty test notifications */ }
  const type = body.type || url.searchParams.get("type");
  const dataId = body.data?.id || url.searchParams.get("data.id");
  if (type !== "payment" || !dataId) return NextResponse.json({ received: true });

  if (!verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  })) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });

  const payment = await fetchPayment(dataId);
  if (payment.status !== "approved" || !payment.external_reference) {
    return NextResponse.json({ received: true });
  }
  const supabase = supabaseAdmin();
  const { data: order } = await supabase.from("orders")
    .select("id, status, tier, amount, contact_email, mp_payment_id, mp_preference_id")
    .eq("id", payment.external_reference).single();
  if (!order || !order.amount || !order.tier) {
    return NextResponse.json({ error: "Orden desconocida o incompleta" }, { status: 422 });
  }

  const matchesAmount = Number.isFinite(payment.transaction_amount) &&
    Math.round(payment.transaction_amount * 100) === order.amount;
  const matchesPreference = !payment.preference_id ||
    payment.preference_id === order.mp_preference_id;
  if (payment.currency_id !== "MXN" || !matchesAmount || !matchesPreference) {
    console.error("Pago incompatible con pedido", { orderId: order.id, paymentId: dataId });
    return NextResponse.json({ error: "Pago incompatible con pedido" }, { status: 422 });
  }
  if (order.mp_payment_id && order.mp_payment_id !== dataId) {
    return NextResponse.json({ error: "La orden ya tiene otro pago asociado" }, { status: 409 });
  }
  if (order.status === "delivered") return NextResponse.json({ received: true });
  if (order.status !== "preview" && order.status !== "paid") {
    return NextResponse.json({ error: "La orden no puede entregarse" }, { status: 409 });
  }

  const { data: song } = await supabase.from("songs")
    .select("id, preview_url, alternate_url, full_url").eq("order_id", order.id).single();
  if (!song?.preview_url) return NextResponse.json({ error: "Canción no disponible" }, { status: 409 });

  const { error: paidError } = await supabase.from("orders")
    .update({ status: "paid", mp_payment_id: dataId }).eq("id", order.id);
  if (paidError) return NextResponse.json({ error: "No se pudo verificar la orden" }, { status: 500 });

  try {
    const primary = song.full_url || await storeTrack(song.preview_url, order.id, "primary");
    const alternate = order.tier === "premium" && song.alternate_url
      ? await storeTrack(song.alternate_url, order.id, "alternate")
      : null;
    const { error: songError } = await supabase.from("songs")
      .update({ full_url: primary, alternate_file: alternate }).eq("id", song.id);
    if (songError) throw songError;

    if (order.contact_email) await sendDeliveryEmail({
      to: order.contact_email, orderId: order.id, names: "tu persona especial",
    });
    const { error: finishError } = await supabase.from("orders")
      .update({ status: "delivered" }).eq("id", order.id);
    if (finishError) throw finishError;
  } catch (err) {
    console.error("Entrega incompleta, el webhook puede reintentarse", err);
    return NextResponse.json({ error: "Entrega pendiente" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}