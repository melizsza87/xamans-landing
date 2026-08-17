import "server-only";
import { MercadoPagoConfig, Preference } from "mercadopago";
import crypto from "node:crypto";

let config: MercadoPagoConfig | null = null;

function getConfig() {
  if (config) return config;

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing MP_ACCESS_TOKEN environment variable");
  }

  config = new MercadoPagoConfig({ accessToken });
  return config;
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
  const preference = new Preference(getConfig());
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
        success: `${siteUrl}/descarga/${orderId}`,
        pending: `${siteUrl}/preview/${orderId}`,
        failure: `${siteUrl}/preview/${orderId}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
    },
  });

  return {
    checkoutUrl: response.init_point as string,
    preferenceId: response.id as string,
  };
}

// Verifies the `x-signature` header MercadoPago sends with every webhook
// notification, per https://www.mercadopago.com/developers — the manifest
// template is `id:{data.id};request-id:{x-request-id};ts:{ts};`.
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
  if (!secret) {
    throw new Error("Missing MP_WEBHOOK_SECRET environment variable");
  }
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key.trim(), value?.trim()];
    })
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(v1, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function fetchPayment(paymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`No se pudo consultar el pago ${paymentId}: ${res.status}`);
  }
  return res.json();
}
