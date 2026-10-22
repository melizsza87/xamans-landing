import { recordOrderEvent } from "@/lib/telemetry";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  verifyWebhookSignature,
  fetchPayment,
  paymentMatchesOrder,
  paymentMatchesPreference,
} from "@/lib/mercadopago";
import { sendDeliveryEmail } from "@/lib/resend";

export const maxDuration = 60;

const acknowledge = () => NextResponse.json({ received: true });
const unavailable = () =>
  NextResponse.json(
    { error: "No se pudo completar la confirmación. Se reintentará." },
    { status: 503 },
  );

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    // The signed resource ID comes from the URL, never an unsigned body field.
    const dataId = url.searchParams.get("data.id");
    const body = (await request.json().catch(() => ({}))) as {
      type?: unknown;
      data?: { id?: unknown };
    };
    const type = url.searchParams.get("type") || body.type;
    if (type !== "payment") return acknowledge();
    if (
      !dataId ||
      (body.data?.id != null && String(body.data.id) !== dataId) ||
      !verifyWebhookSignature({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId,
      })
    )
      return NextResponse.json(
        { error: "Notificación inválida" },
        { status: 401 },
      );

    const payment = await fetchPayment(dataId);
    if (!payment.external_reference) return acknowledge();
    const db = supabaseAdmin();
    const { data: order, error } = await db
      .from("orders")
      .select(
        "id, status, amount, tier, mp_payment_id, mp_preference_id, contact_email, delivery_email_sent_at, delivery_email_first_attempt_at, payment_status",
      )
      .eq("id", payment.external_reference)
      .single();
    if (error || !order) return acknowledge();
    if (
      !order.mp_preference_id ||
      !paymentMatchesOrder(payment, order, dataId) ||
      !(await paymentMatchesPreference(payment, order.mp_preference_id))
    ) {
      return NextResponse.json(
        { error: "El pago no corresponde al pedido" },
        { status: 409 },
      );
    }

    if (payment.status !== "approved") {
      // A new rejected attempt must never undo an approved purchase. A refund or
      // chargeback of the bound payment does revoke subsequent download access.
      const revoked = ["refunded", "charged_back", "cancelled"].includes(
        payment.status,
      );
      if (revoked) {
        // Bind terminal notifications even when they beat the first approved
        // handler. Its stale snapshot must not later resurrect this payment.
        const result = await db
          .from("orders")
          .update({ payment_status: payment.status, mp_payment_id: dataId })
          .eq("id", order.id)
          .or(`mp_payment_id.is.null,mp_payment_id.eq.${dataId}`);
        if (result.error) return unavailable();
      } else if (order.status !== "paid" && order.status !== "delivered") {
        const result = await db
          .from("orders")
          .update({ payment_status: payment.status })
          .eq("id", order.id)
          .is("mp_payment_id", null);
        if (result.error) return unavailable();
      }
      return acknowledge();
    }

    // Terminal revocations are monotonic locally: an older approved handler
    // cannot restart fulfillment after a refund/chargeback handler has run.
    if (
      ["refunded", "charged_back", "cancelled"].includes(order.payment_status)
    )
      return acknowledge();

    // Claim the paid transition once. UNIQUE(mp_payment_id) additionally prevents
    // the same payment being attached to another order by concurrent requests.
    if (!order.mp_payment_id) {
      const result = await db
        .from("orders")
        .update({
          status: "paid",
          payment_status: "approved",
          mp_payment_id: dataId,
        })
        .eq("id", order.id)
        .is("mp_payment_id", null)
        .not("payment_status", "in", "(refunded,charged_back,cancelled)")
        .select("id")
        .maybeSingle();
      if (result.error) return unavailable();
      if (!result.data) return unavailable();
      await recordOrderEvent("payment_approved", order.id);
    }
    if (order.status === "delivered" && order.delivery_email_sent_at)
      return acknowledge();

    const { data: song, error: songError } = await db
      .from("songs")
      .select("status, full_url, track_paths")
      .eq("order_id", order.id)
      .single();
    // Private delivery assets must already exist; never copy arbitrary remote
    // URLs from payment notifications or introduce SSRF into the webhook.
    if (
      songError ||
      !song ||
      song.status !== "ready" ||
      !song.full_url ||
      order.tier !== "premium" ||
      !song.track_paths ||
      song.track_paths.length < 2 ||
      !order.contact_email
    )
      return unavailable();

    // Provider idempotency keys last 24h. Beyond 23h an uncertain send must be
    // reconciled by a human, never retried as a potentially duplicate email.
    if (
      order.delivery_email_first_attempt_at &&
      (!Number.isFinite(Date.parse(order.delivery_email_first_attempt_at)) ||
        Date.now() - Date.parse(order.delivery_email_first_attempt_at) >
          23 * 60 * 60 * 1000)
    )
      return unavailable();

    const now = new Date().toISOString();
    const expired = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const lease = await db
      .from("orders")
      .update({
        delivery_claimed_at: now,
        delivery_email_first_attempt_at:
          order.delivery_email_first_attempt_at || now,
      })
      .eq("id", order.id)
      .eq("payment_status", "approved")
      .is("delivery_email_sent_at", null)
      .or(`delivery_claimed_at.is.null,delivery_claimed_at.lt.${expired}`)
      .select("id")
      .maybeSingle();
    if (lease.error) return unavailable();
    if (!lease.data) {
      // Return non-2xx while another worker owns the lease: a retry can recover
      // a crashed worker after expiry instead of silently losing delivery.
      return unavailable();
    }
    try {
      const { data: personalization } = await db
        .from("personalizations")
        .select("names")
        .eq("order_id", order.id)
        .single();
      // Resend uses stable delivery/order idempotency; a crash after sending is
      // safe to retry within its provider idempotency retention window (24h).
      const { data: stillPaid } = await db
        .from("orders")
        .select("payment_status")
        .eq("id", order.id)
        .eq("payment_status", "approved")
        .maybeSingle();
      if (!stillPaid) return unavailable();
      await sendDeliveryEmail({
        to: order.contact_email,
        orderId: order.id,
        names: personalization?.names || "",
      });
      const delivered = await db
        .from("orders")
        .update({
          status: "delivered",
          delivery_email_sent_at: new Date().toISOString(),
          delivery_claimed_at: null,
        })
        .eq("id", order.id)
        .eq("delivery_claimed_at", now)
        .eq("payment_status", "approved")
        .select("id")
        .maybeSingle();
      if (delivered.error || !delivered.data) return unavailable();
    } catch {
      await db
        .from("orders")
        .update({ delivery_claimed_at: null })
        .eq("id", order.id)
        .eq("delivery_claimed_at", now);
      return unavailable();
    }
    return acknowledge();
  } catch {
    // No provider payload, customer email, or internal exception reaches logs or clients.
    return unavailable();
  }
}
