import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  let orderId: unknown;
  try { ({ orderId } = await request.json()); }
  catch { return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 }); }
  if (typeof orderId !== "string" || !UUID.test(orderId)) {
    return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const { data: order } = await supabase.from("orders")
    .select("id, status").eq("id", orderId).single();
  if (!order || !["paid", "delivered"].includes(order.status)) {
    return NextResponse.json({ error: "El enlace estará disponible después del pago" }, { status: 403 });
  }
  const { data: song } = await supabase.from("songs")
    .select("full_url").eq("order_id", orderId).single();
  if (!song?.full_url) {
    return NextResponse.json({ error: "Tu canción todavía no está disponible" }, { status: 409 });
  }

  // The order URL is an unguessable bearer credential. Sharing generates
  // a separate, revocable-by-rotation token that never exposes buyer email.
  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase.from("anonymous_shares").upsert({
    order_id: orderId, token_hash: tokenHash,
  }, { onConflict: "order_id" });
  if (error) {
    console.error("No se pudo crear enlace anónimo", error);
    return NextResponse.json({ error: "No se pudo crear el enlace" }, { status: 500 });
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const shareUrl = new URL("/regalo/" + token, origin).toString();
  return NextResponse.json({ shareUrl }, { headers: { "Cache-Control": "no-store" } });
}