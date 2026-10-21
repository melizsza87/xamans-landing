import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyWebhookSignature, fetchPayment } from "@/lib/mercadopago";
import { sendDeliveryEmail } from "@/lib/resend";

export const maxDuration = 60;

interface MpWebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: MpWebhookBody = {};
  try {
    body = await request.json();
  } catch {
    // MercadoPago also pings with empty/non-JSON bodies for test notifications.
  }

  const type = body.type || url.searchParams.get("type");
  const dataId = body.data?.id || url.searchParams.get("data.id");

  if (type !== "payment" || !dataId) {
    // Not a payment event — acknowledge and ignore.
    return NextResponse.json({ received: true });
  }

  const isValid = verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!isValid) {
    console.error("Firma de webhook de MercadoPago inválida");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payment: {
    status: string;
    external_reference: string | null;
    payer?: { email?: string };
  };

  try {
    payment = await fetchPayment(dataId);
  } catch (err) {
    console.error("Error consultando el pago en MercadoPago:", err);
    return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 502 });
  }

  if (payment.status !== "approved" || !payment.external_reference) {
    return NextResponse.json({ received: true });
  }

  const orderId = payment.external_reference;
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error(`Orden ${orderId} no encontrada para el pago ${dataId}`);
    return NextResponse.json({ received: true });
  }

  const { data: song } = await supabase
    .from("songs")
    .select("id, preview_url, full_url")
    .eq("order_id", orderId)
    .single();

  const payerEmail = payment.payer?.email;

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      mp_payment_id: dataId,
      contact_email: payerEmail ?? null,
    })
    .eq("id", orderId);

  if (updateOrderError) {
    console.error("Error marcando la orden como pagada:", updateOrderError);
    return NextResponse.json({ error: "No se pudo actualizar la orden" }, { status: 500 });
  }

  try {
    if (song && !song.full_url && song.preview_url) {
      const audioRes = await fetch(song.preview_url as string);
      if (!audioRes.ok) {
        throw new Error(`No se pudo descargar el audio: ${audioRes.status}`);
      }
      const audioBuffer = await audioRes.arrayBuffer();
      const storagePath = `${orderId}.mp3`;

      const { error: uploadError } = await supabase.storage
        .from("tracks")
        .upload(storagePath, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error subiendo a Storage: ${uploadError.message}`);
      }

      await supabase
        .from("songs")
        .update({ full_url: storagePath })
        .eq("id", song.id);
    }

    if (payerEmail) {
      const { data: personalization } = await supabase
        .from("personalizations")
        .select("names")
        .eq("order_id", orderId)
        .single();

      await sendDeliveryEmail({
        to: payerEmail,
        orderId,
        names: (personalization as { names?: string } | null)?.names || "",
      });
    }

    await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);
  } catch (err) {
    console.error("Error entregando la canción tras el pago:", err);
    // The order is already marked as paid; MercadoPago will retry this
    // notification, which is safe to re-run (storage upload is idempotent).
    return NextResponse.json({ error: "Entrega incompleta" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
