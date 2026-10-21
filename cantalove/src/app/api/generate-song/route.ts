import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { submitSunoGeneration } from "@/lib/apiframe";

export async function POST(request: Request) {
  if (!process.env.APIFRAME_API_KEY) {
    return NextResponse.json({ error: "El motor musical aún no está configurado." }, { status: 503 });
  }
  let orderId: unknown;
  try { ({ orderId } = await request.json()); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  if (typeof orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const [{ data: order }, { data: song }, { data: personalization }] = await Promise.all([
    supabase.from("orders").select("id, status").eq("id", orderId).single(),
    supabase.from("songs").select("id, lyrics, apiframe_job_id, status").eq("order_id", orderId).single(),
    supabase.from("personalizations").select("names, genre, voice, duration").eq("order_id", orderId).single(),
  ]);
  if (!order || !song || !personalization || !song.lyrics) {
    return NextResponse.json({ error: "Orden incompleta o no encontrada" }, { status: 404 });
  }
  if (song.apiframe_job_id) return NextResponse.json({ jobId: song.apiframe_job_id });
  if (order.status !== "generating" || song.status !== "generating") {
    return NextResponse.json({ error: "La canción ya no está en proceso de generación" }, { status: 409 });
  }

  try {
    const jobId = await submitSunoGeneration({
      lyrics: song.lyrics, genre: personalization.genre, voice: personalization.voice,
      duration: personalization.duration, title: "Canción para " + personalization.names,
    });
    const { error } = await supabase.from("songs")
      .update({ apiframe_job_id: jobId }).eq("id", song.id).is("apiframe_job_id", null);
    if (error) throw error;
    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("No se pudo iniciar generación musical", err);
    await supabase.from("songs").update({ status: "failed" }).eq("order_id", orderId);
    await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
    const { data: account } = await supabase.from("orders").select("contact_email").eq("id", orderId).single();
    if (account?.contact_email && process.env.FREE_EMAIL_HASH_SECRET) {
      const { createHmac } = await import("node:crypto");
      const key = createHmac("sha256", process.env.FREE_EMAIL_HASH_SECRET).update(account.contact_email.trim().toLowerCase()).digest("hex");
      await supabase.from("free_generations").delete().eq("email_hash", key).eq("order_id", orderId);
    }
    return NextResponse.json({ error: "No se pudo iniciar la canción. Escríbenos para ayudarte." }, { status: 502 });
  }
}