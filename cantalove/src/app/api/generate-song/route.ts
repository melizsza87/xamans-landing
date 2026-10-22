import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { submitSunoGeneration } from "@/lib/apiframe";
import { authorizedOrder } from "@/lib/access";
import { jsonBody, failure, HttpError, requireKeys } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as { orderId?: unknown };
    if (
      typeof body.orderId !== "string" ||
      !(await authorizedOrder(body.orderId))
    )
      throw new HttpError(
        404,
        "Pedido no disponible. Verifica tu correo para recuperarlo.",
      );
    const orderId = body.orderId;
    const db = supabaseAdmin();
    const { data: song } = await db
      .from("songs")
      .select("*")
      .eq("order_id", orderId)
      .single();
    if (song?.apiframe_job_id)
      return NextResponse.json({ jobId: song.apiframe_job_id });
    if (!song?.lyrics) throw new HttpError(409, "La letra aún no está lista.");
    requireKeys("APIFRAME_API_KEY");
    if (
      process.env.GENERATION_ENABLED !== "true" ||
      process.env.LEGAL_APPROVED !== "true"
    )
      throw new HttpError(503, "Generación pendiente de validación.");
    const { data: personalization } = await db
      .from("personalizations")
      .select("*")
      .eq("order_id", orderId)
      .single();
    const { data: order } = await db
      .from("orders")
      .select("brand")
      .eq("id", orderId)
      .single();
    if (!personalization) throw new Error("Missing personalization");
    const { data: claim, error } = await db
      .from("songs")
      .update({ submission_started_at: new Date().toISOString() })
      .eq("id", song.id)
      .is("submission_started_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Submission claim failed");
    if (!claim)
      throw new HttpError(
        409,
        "Tu generación está en proceso o requiere revisión. Recupera el pedido; no la duplicaremos.",
      );
    try {
      const jobId = await submitSunoGeneration({
        lyrics: song.lyrics,
        genre:
          personalization.genre +
          (personalization.vibe ? ", " + personalization.vibe : ""),
        voice: personalization.voice,
        duration: personalization.duration,
        title: "Tu historia hecha canción",
        brand: order?.brand as "love" | "heartbreak",
      });
      const { error: saveError } = await db
        .from("songs")
        .update({ apiframe_job_id: jobId })
        .eq("id", song.id);
      if (saveError) throw new Error("Job persistence failed");
      await db
        .from("generation_costs")
        .insert({
          order_id: orderId,
          provider: "apiframe",
          model: "suno",
          credits: 11,
          input_tokens: 0,
          output_tokens: 0,
        });
      return NextResponse.json({ jobId });
    } catch {
      throw new HttpError(
        502,
        "El proveedor no confirmó el inicio. Conservamos tu pedido para revisarlo sin duplicar la generación.",
      );
    }
  } catch (e) {
    return failure(e);
  }
}
