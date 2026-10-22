import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateLyrics } from "@/lib/anthropic";

interface GenerateLyricsBody {
  email: string;
  occasion: string;
  names: string;
  story: string;
  genre: string;
  voice: string;
  duration: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { occasion: 60, names: 120, story: 1800, genre: 60, voice: 24, duration: 24 } as const;

function parseBody(input: unknown): GenerateLyricsBody | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  for (const [field, limit] of Object.entries(MAX_LENGTHS)) {
    const value = data[field];
    if (typeof value !== "string" || value.trim().length < 1 || value.length > limit) return null;
  }
  return {
    email,
    occasion: (data.occasion as string).trim(),
    names: (data.names as string).trim(),
    story: (data.story as string).trim(),
    genre: (data.genre as string).trim(),
    voice: (data.voice as string).trim(),
    duration: (data.duration as string).trim(),
  };
}

export async function POST(request: Request) {
  const secret = process.env.FREE_EMAIL_HASH_SECRET;
  if (!secret || !process.env.ANTHROPIC_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "La generación de canciones aún no está configurada." }, { status: 503 });
  }

  let data: GenerateLyricsBody | null;
  try { data = parseBody(await request.json()); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  if (!data) return NextResponse.json({ error: "Revisa el correo y completa los campos. Tu historia puede tener hasta 1,800 caracteres." }, { status: 400 });

  const { email, occasion, names, story, genre, voice, duration } = data;
  const emailHash = createHmac("sha256", secret).update(email).digest("hex");
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase.from("orders")
    .insert({ status: "generating", contact_email: email }).select("id").single();
  if (orderError || !order) {
    console.error("Error creando orden", orderError);
    return NextResponse.json({ error: "No se pudo crear tu canción" }, { status: 500 });
  }

  const orderId = order.id as string;
  const { error: claimError } = await supabase.from("free_generations")
    .insert({ email_hash: emailHash, order_id: orderId });
  if (claimError) {
    await supabase.from("orders").delete().eq("id", orderId);
    return NextResponse.json({
      error: claimError.code === "23505"
        ? "Este correo ya utilizó su generación gratuita. Pronto habilitaremos canciones adicionales."
        : "No pudimos validar tu generación gratuita.",
    }, { status: claimError.code === "23505" ? 409 : 500 });
  }

  try {
    const { error: personalizationError } = await supabase.from("personalizations").insert({
      order_id: orderId, occasion, names, story, genre, voice, duration,
    });
    if (personalizationError) throw personalizationError;
    const lyrics = await generateLyrics({ occasion, names, story, genre });
    const { error: songError } = await supabase.from("songs").insert({
      order_id: orderId, lyrics, status: "generating",
    });
    if (songError) throw songError;
    return NextResponse.json({ lyrics, orderId });
  } catch (err) {
    console.error("No se pudo generar la letra", err);
    await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
    await supabase.from("free_generations").delete().eq("email_hash", emailHash).eq("order_id", orderId);
    return NextResponse.json({ error: "No se pudo generar la letra. Intenta nuevamente." }, { status: 502 });
  }
}