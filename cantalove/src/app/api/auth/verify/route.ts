import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { jsonBody, failure, HttpError } from "@/lib/http";
import { normalizeEmail } from "@/lib/validation";
import { privateHash, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SESSION_COOKIE, hashToken } from "@/lib/access";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as {
      email?: unknown;
      code?: unknown;
    };
    const email = normalizeEmail(body?.email);
    if (!email || typeof body.code !== "string" || !/^\d{6}$/.test(body.code))
      throw new HttpError(400, "Revisa tu correo y el código de seis dígitos.");
    await rateLimit("verify:" + email, 15, 3600);
    const { data, error } = await supabaseAdmin().rpc("verify_email_code", {
      customer_email: email,
      submitted_hash: privateHash(email + ":" + body.code),
    });
    if (error) throw new Error("Challenge verify failed");
    if (!data)
      throw new HttpError(400, "Código incorrecto o vencido. Solicita otro.");
    const token = randomBytes(32).toString("hex");
    const { error: writeError } = await supabaseAdmin()
      .from("customer_sessions")
      .insert({
        email,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
    if (writeError) throw new Error("Session write failed");
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 86400,
    });
    return NextResponse.json({ verified: true });
  } catch (e) {
    return failure(e);
  }
}
