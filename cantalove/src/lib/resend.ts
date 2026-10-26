import "server-only";
import { Resend } from "resend";
function client() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    throw new Error("Email service unavailable");
  return new Resend(process.env.RESEND_API_KEY);
}
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function sendVerificationEmail(to: string, code: string) {
  const { error } = await client().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Tu código de Cantalove",
    text: `Tu código es ${code}. Vence en 10 minutos. Si no lo solicitaste, ignora este correo.`,
  });
  if (error) throw new Error("Verification email unavailable");
}
export async function sendDeliveryEmail({
  to,
  orderId,
  names,
}: {
  to: string;
  orderId: string;
  names: string;
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("Site configuration required");
  const url = new URL("/recuperar", base);
  url.searchParams.set("order", orderId);
  const { error } = await client().emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject: "Tu canción ya está lista 🎶",
      html: `<h1>Tu canción para ${escapeHtml(names)} está lista</h1><p>Tu pago está confirmado. Verifica tu correo para recuperar tu pedido y descargar tus dos versiones y la letra.</p><p><a href="${escapeHtml(url.toString())}">Recuperar mi canción</a></p>`,
      text: `Tu pago está confirmado. Recupera tu pedido verificando tu correo: ${url}`,
    },
    { idempotencyKey: `delivery/${orderId}` },
  );
  if (error) throw new Error("Delivery email unavailable");
}
