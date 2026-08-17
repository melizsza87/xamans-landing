import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSunoTrack } from "@/lib/apiframe";

// Suno rendering can take a few minutes; give this route room to poll.
// Requires a Vercel plan that supports extended function duration.
export const maxDuration = 300;

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
    const clip = await generateSunoTrack({
      lyrics,
      genre,
      voice,
      duration,
      title: personalization
        ? `Canción para ${(personalization as { names: string }).names}`
        : "cantalove",
    });

    const { data: song, error: songError } = await supabase
      .from("songs")
      .update({ preview_url: clip.audioUrl, status: "ready" })
      .eq("order_id", orderId)
      .select("id")
      .single();

    if (songError || !song) {
      console.error("Error guardando canción:", songError);
      return NextResponse.json(
        { error: "No se pudo guardar la canción generada" },
        { status: 500 }
      );
    }

    await supabase
      .from("orders")
      .update({ status: "preview" })
      .eq("id", orderId);

    return NextResponse.json({
      previewUrl: clip.audioUrl,
      songId: song.id,
    });
  } catch (err) {
    console.error("Error generando canción con Apiframe/Suno:", err);
    await supabase
      .from("songs")
      .update({ status: "failed" })
      .eq("order_id", orderId);
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json(
      { error: "No se pudo generar la música" },
      { status: 502 }
    );
  }
}
