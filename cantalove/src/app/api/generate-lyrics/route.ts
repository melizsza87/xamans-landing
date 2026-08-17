import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateLyrics } from "@/lib/anthropic";

interface GenerateLyricsBody {
  occasion: string;
  names: string;
  story: string;
  genre: string;
  voice: string;
  duration: string;
}

function isValidBody(body: unknown): body is GenerateLyricsBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.occasion === "string" &&
    b.occasion.trim().length > 0 &&
    typeof b.names === "string" &&
    b.names.trim().length > 0 &&
    typeof b.story === "string" &&
    b.story.trim().length > 0 &&
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
      { error: "Faltan campos requeridos: occasion, names, story, genre, voice, duration" },
      { status: 400 }
    );
  }

  const { occasion, names, story, genre, voice, duration } = body;
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ status: "generating" })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Error creando orden:", orderError);
    return NextResponse.json(
      { error: "No se pudo crear la orden" },
      { status: 500 }
    );
  }

  const orderId = order.id as string;

  const { error: personalizationError } = await supabase
    .from("personalizations")
    .insert({
      order_id: orderId,
      occasion,
      names,
      story,
      genre,
      voice,
      duration,
    });

  if (personalizationError) {
    console.error("Error guardando personalización:", personalizationError);
    return NextResponse.json(
      { error: "No se pudo guardar la personalización" },
      { status: 500 }
    );
  }

  try {
    const lyrics = await generateLyrics({ occasion, names, story, genre });

    const { error: songError } = await supabase.from("songs").insert({
      order_id: orderId,
      lyrics,
      status: "generating",
    });

    if (songError) {
      console.error("Error guardando letra:", songError);
      return NextResponse.json(
        { error: "No se pudo guardar la letra generada" },
        { status: 500 }
      );
    }

    return NextResponse.json({ lyrics, orderId });
  } catch (err) {
    console.error("Error generando letra con Claude:", err);
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json(
      { error: "No se pudo generar la letra" },
      { status: 502 }
    );
  }
}
