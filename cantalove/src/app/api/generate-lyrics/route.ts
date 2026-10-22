import { recordEvent } from "@/lib/telemetry";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateLyricsWithUsage } from "@/lib/anthropic";
import { validateBrief } from "@/lib/validation";
import { sessionEmail } from "@/lib/access";
import { jsonBody, failure, HttpError, requireKeys } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const brief = validateBrief(await jsonBody(request));
    if (!brief)
      throw new HttpError(
        400,
        "Revisa los datos de tu historia y acepta los términos.",
      );
    const email = await sessionEmail();
    if (!email || email !== brief.email)
      throw new HttpError(401, "Verifica tu correo antes de crear la canción.");
    requireKeys("ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "APIFRAME_API_KEY");
    if (
      process.env.GENERATION_ENABLED !== "true" ||
      process.env.LEGAL_APPROVED !== "true"
    )
      throw new HttpError(
        503,
        "La creación de canciones estará disponible cuando terminemos de validar el servicio.",
      );
    const db = supabaseAdmin();
    const { data: reservation, error } = await db.rpc("reserve_free_order", {
      customer_email: email,
      request_key: brief.requestId,
      brief: {
        occasion: brief.occasion,
        names: brief.names,
        story: brief.story,
        genre: brief.genre,
        voice: brief.voice,
        duration: brief.duration,
        brand: brief.brand,
        vibe: brief.vibe ?? "",
      },
    });
    if (error) throw new Error("Order reservation failed");
    const result = reservation as {
      id: string;
      created: boolean;
      limited?: boolean;
    };
    if (result.limited)
      throw new HttpError(
        429,
        "La capacidad diaria se ha completado. Inténtalo mañana.",
      );
    if (!result.created) {
      const { data: song } = await db
        .from("songs")
        .select("lyrics")
        .eq("order_id", result.id)
        .maybeSingle();
      if (song?.lyrics)
        return NextResponse.json({ orderId: result.id, lyrics: song.lyrics });
      throw new HttpError(
        409,
        "Tu generación gratuita ya está registrada. Recupera tu pedido; no volveremos a generar ni cobrar automáticamente.",
      );
    }
    await recordEvent("form_complete", brief.brand);
    await recordEvent("generation_start", brief.brand);
    try {
      const generated = await generateLyricsWithUsage(brief);
      const { error: saveError } = await db
        .from("songs")
        .update({ lyrics: generated.lyrics })
        .eq("order_id", result.id);
      if (saveError) throw new Error("Lyrics persistence failed");
      await db
        .from("generation_costs")
        .insert({
          order_id: result.id,
          provider: "anthropic",
          model: generated.model,
          input_tokens: generated.inputTokens,
          output_tokens: generated.outputTokens,
          credits: 0,
        });
      return NextResponse.json({
        orderId: result.id,
        lyrics: generated.lyrics,
      });
    } catch {
      await db.from("orders").update({ status: "failed" }).eq("id", result.id);
      throw new HttpError(
        502,
        "No pudimos completar la letra. Tu pedido está guardado; recupéralo para consultar su estado.",
      );
    }
  } catch (e) {
    return failure(e);
  }
}
