import "server-only";
import { MercadoPagoConfig, Preference } from "mercadopago";
import crypto from "node:crypto";

// Fail closed: a preview is always sandbox unless live mode is deliberately enabled.
export function paymentMode(): "sandbox" | "live" {
  if (process.env.MP_ENVIRONMENT === "live") {
    if (process.env.MP_ENABLE_LIVE_PAYMENTS !== "true")
      throw new Error("Live payments disabled");
    return "live";
  }
  return "sandbox";
}

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Payment service unavailable");
  return token;
}

async function apiGet(path: string): Promise<unknown> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Payment provider request failed");
  return response.json();
}

// A test redirect alone cannot make production credentials safe. Check the
// authenticated seller before creating any preference with a provider credential.
async function verifySeller() {
  const expected = process.env.MP_SELLER_ID;
  if (!expected || !/^\d+$/.test(expected))
    throw new Error("Payment seller not configured");
  const seller = (await apiGet("/users/me")) as {
    id?: number;
    tags?: string[];
  };
  if (String(seller.id) !== expected)
    throw new Error("Payment seller mismatch");
  if (paymentMode() === "sandbox" && !seller.tags?.includes("test_user")) {
    throw new Error("Sandbox requires a test seller account");
  }
}

interface CreatePreferenceInput {
  orderId: string;
  title: string;
  amountCents: number;
}

export async function createCheckoutPreference({
  orderId,
  title,
  amountCents,
}: CreatePreferenceInput) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0)
    throw new Error("Invalid payment amount");
  await verifySeller();
  const siteUrl = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
  if (siteUrl.protocol !== "https:") throw new Error("Checkout requires HTTPS");
  const preference = new Preference(
    new MercadoPagoConfig({
      accessToken: accessToken(),
      options: { timeout: 15000 },
    }),
  );
  const response = await preference.create({
    body: {
      items: [
        {
          id: orderId,
          title,
          quantity: 1,
          currency_id: "MXN",
          unit_price: amountCents / 100,
        },
      ],
      external_reference: orderId,
      back_urls: {
        success: `${siteUrl.origin}/descarga/${orderId}`,
        pending: `${siteUrl.origin}/preview/${orderId}`,
        failure: `${siteUrl.origin}/preview/${orderId}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl.origin}/api/mercadopago/webhook`,
    },
    requestOptions: { idempotencyKey: `cantalove-${orderId}-${amountCents}` },
  });
  const checkoutUrl =
    paymentMode() === "sandbox"
      ? response.sandbox_init_point
      : response.init_point;
  if (!checkoutUrl || !response.id) throw new Error("Checkout unavailable");
  validateCheckoutUrl(checkoutUrl);
  return { checkoutUrl, preferenceId: response.id };
}

function validateCheckoutUrl(checkoutUrl: string) {
  const checkout = new URL(checkoutUrl);
  if (
    checkout.protocol !== "https:" ||
    !/(^|\.)mercadopago\.com(\.mx)?$/.test(checkout.hostname) ||
    (paymentMode() === "sandbox" && !checkout.hostname.startsWith("sandbox."))
  ) {
    throw new Error("Invalid checkout URL");
  }
}

// Recover the provider's existing preference after refresh/back navigation.
// A stored identifier is never treated as a redirect URL or permission to pay.
export async function recoverCheckoutPreference(
  preferenceId: string,
  orderId: string,
  amountCents: number,
) {
  if (
    !preferenceId ||
    preferenceId === "creating" ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0
  ) {
    throw new Error("Checkout requires reconciliation");
  }
  await verifySeller();
  const preference = (await apiGet(
    `/checkout/preferences/${encodeURIComponent(preferenceId)}`,
  )) as {
    id?: string;
    external_reference?: string;
    collector_id?: number;
    items?: {
      id?: string;
      currency_id?: string;
      quantity?: number;
      unit_price?: number;
    }[];
    sandbox_init_point?: string;
    init_point?: string;
    expires?: boolean;
    expiration_date_to?: string;
  };
  const item = preference.items?.[0];
  if (
    preference.id !== preferenceId ||
    preference.external_reference !== orderId ||
    String(preference.collector_id) !== process.env.MP_SELLER_ID ||
    preference.items?.length !== 1 ||
    !item ||
    item.id !== orderId ||
    item.currency_id !== "MXN" ||
    item.quantity !== 1 ||
    item.unit_price !== amountCents / 100
  ) {
    throw new Error("Checkout does not match order");
  }
  if (
    preference.expires &&
    (!preference.expiration_date_to ||
      !Number.isFinite(Date.parse(preference.expiration_date_to)) ||
      Date.parse(preference.expiration_date_to) <= Date.now())
  ) {
    throw new Error("Checkout expired; requires reconciliation");
  }
  const checkoutUrl =
    paymentMode() === "sandbox"
      ? preference.sandbox_init_point
      : preference.init_point;
  if (!checkoutUrl) throw new Error("Checkout unavailable");
  validateCheckoutUrl(checkoutUrl);
  return { checkoutUrl, preferenceId };
}

export function verifyWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !xSignature || !xRequestId || !/^\d+$/.test(dataId))
    return false;
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key.trim(), value?.trim()];
    }),
  );
  const { ts, v1 } = parts;
  if (!/^\d{10,13}$/.test(ts || "") || !/^[a-f0-9]{64}$/i.test(v1 || ""))
    return false;
  const timestamp = Number(ts) * (ts.length === 10 ? 1000 : 1);
  if (Math.abs(Date.now() - timestamp) > 10 * 60 * 1000) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest();
  return crypto.timingSafeEqual(expected, Buffer.from(v1, "hex"));
}

export interface VerifiedPayment {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  collector_id: number;
  live_mode: boolean;
  order?: { id?: number; type?: string };
}

export async function fetchPayment(
  paymentId: string,
): Promise<VerifiedPayment> {
  if (!/^\d+$/.test(paymentId)) throw new Error("Invalid payment identifier");
  return (await apiGet(`/v1/payments/${paymentId}`)) as VerifiedPayment;
}

export function paymentMatchesOrder(
  payment: VerifiedPayment,
  order: {
    id: string;
    amount: number | null;
    mp_payment_id: string | null;
  },
  notifiedId: string,
): boolean {
  return (
    String(payment.id) === notifiedId &&
    payment.external_reference === order.id &&
    payment.currency_id === "MXN" &&
    typeof payment.transaction_amount === "number" &&
    Number.isFinite(payment.transaction_amount) &&
    Number.isSafeInteger(order.amount) &&
    payment.transaction_amount === (order.amount as number) / 100 &&
    String(payment.collector_id) === process.env.MP_SELLER_ID &&
    payment.live_mode === (paymentMode() === "live") &&
    (!order.mp_payment_id || order.mp_payment_id === notifiedId)
  );
}

export async function paymentMatchesPreference(
  payment: VerifiedPayment,
  preferenceId: string,
): Promise<boolean> {
  if (!payment.order?.id || payment.order.type !== "mercadopago") return false;
  const merchantOrder = (await apiGet(
    `/merchant_orders/${payment.order.id}`,
  )) as { preference_id?: string };
  return merchantOrder.preference_id === preferenceId;
}
