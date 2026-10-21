import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY environment variable");
  client = new Resend(apiKey);
  return client;
}

interface SendDeliveryEmailInput {
  to: string;
  orderId: string;
  names: string;
}

export async function sendDeliveryEmail({
  to,
  orderId,
  names,
}: SendDeliveryEmailInput) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const downloadUrl = `${siteUrl}/descarga/${orderId}`;

  await getClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "cantalove <hola@cantalove.com>",
    to,
    subject: "Tu canción ya está lista 🎶",
    html: `
      <div style="font-family: Georgia, serif; background:#0B0B0F; color:#F9FAFB; padding:32px;">
        <h1 style="color:#DC2626; font-size:22px;">Tu canción para ${names} ya está lista</h1>
        <p>Gracias por confiar en cantalove para regalar algo único. Tu pago fue confirmado y tu canción completa está lista para descargar.</p>
        <p>
          <a href="${downloadUrl}" style="display:inline-block; background:#DC2626; color:#F9FAFB; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Descargar mi canción
          </a>
        </p>
        <p style="color:#9CA3AF; font-size:13px;">Si el botón no funciona, copia y pega este enlace: ${downloadUrl}</p>
      </div>
    `,
  });
}
