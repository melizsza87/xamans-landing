import "server-only";
import { createHmac } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { HttpError } from "@/lib/http";
export function privateHash(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Auth configuration required");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  const { data, error } = await supabaseAdmin().rpc("consume_rate_limit", {
    bucket_key: privateHash(key),
    max_hits: limit,
    window_seconds: seconds,
  });
  if (error) throw new Error("Rate limiter unavailable");
  if (!data)
    throw new HttpError(
      429,
      "Demasiadas solicitudes. Espera antes de volver a intentar.",
    );
}
export async function authLimits(request: Request, email: string) {
  await rateLimit("auth-global", 100, 3600);
  await rateLimit("auth-email:" + email, 5, 3600);
  // Only trust infrastructure-supplied headers on the configured host.
  if (process.env.VERCEL) {
    const ip = request.headers.get("x-vercel-forwarded-for");
    if (ip) await rateLimit("auth-ip:" + ip, 15, 3600);
  }
}
