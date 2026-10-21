import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { submitSunoGeneration } from "@/lib/apiframe";

interface GenerateSongBody {
  orderId: string;
  lyrics: string;
  genre: string;
  voice: string;
  duration: string;
}

function isValidBody(body: unknown): body is GenerateSongBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.orderId === "string" &&
    b.orderId.trim().length > 0 &&
    typeof b.lyrics === "string" &&
    b.lyrics.trim().length > 0 &&
    typeof b.genre === "string" &&
    b.genre.trim().length > 0 &&
    typeof b.voice === "string" &&
    b.voice.trim().length > 0 &&
    typeof b.duration === "string" &&
    b.duration.trim().length > 0
  );
}

// Only submits the Suno job and returns the jobId — it does not wait for the
// track to render. Poll /api/song-status/[jobId] for completion, so this
// route stays well under any serverless function timeout.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: orderId, lyrics, genre, voice, duration" },
      { status: 400 }
    );
  }

  const { orderId, lyrics, genre, voice, duration } = body;
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { data: personalization } = await supabase
    .from("personalizations")
    .select("names")
    .eq("order_id", orderId)
    .single();

  try {
    const jobId = await submitSunoGeneration({
      lyrics,
      genre,
      voice,
      duration,
      title: personalization
        ? `Canción para ${(personalization as { names: string }).names}`
        : "cantalove",
    });

    const { error: songError } = await supabase
      .from("songs")
      .update({ apiframe_job_id: jobId, status: "generating" })
      .eq("order_id", orderId);

    if (songError) {
      console.error("Error guardando apiframe_job_id:", songError);
      return NextResponse.json(
        { error: "No se pudo guardar el trabajo de generación" },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Error enviando el trabajo a Apiframe/Suno:", err);
    await supabase
      .from("songs")
      .update({ status: "failed" })
      .eq("order_id", orderId);
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json(
      { error: "No se pudo iniciar la generación de música" },
      { status: 502 }
    );
  }
}
