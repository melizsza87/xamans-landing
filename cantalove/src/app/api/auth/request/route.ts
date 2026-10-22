import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { jsonBody, failure, HttpError, requireKeys } from "@/lib/http";
import { normalizeEmail } from "@/lib/validation";
import { authLimits, privateHash } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendVerificationEmail } from "@/lib/resend";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as { email?: unknown };
    const email = normalizeEmail(body?.email);
    if (!email) throw new HttpError(400, "Revisa tu correo electrónico.");
    requireKeys(
      "AUTH_SECRET",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    await authLimits(request, email);
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    const { error } = await supabaseAdmin()
      .from("email_challenges")
      .upsert({
        email,
        code_hash: privateHash(email + ":" + code),
        expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
        attempts: 0,
      });
    if (error) throw new Error("Challenge write failed");
    await sendVerificationEmail(email, code);
    return NextResponse.json({
      message: "Te enviamos un código que vence en 10 minutos.",
    });
  } catch (e) {
    return failure(e);
  }
}
