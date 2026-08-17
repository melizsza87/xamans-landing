import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[orderId]">
) {
  const { orderId } = await params;
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status !== "paid" && order.status !== "delivered") {
    return NextResponse.json(
      { error: "El pago de esta orden aún no está confirmado" },
      { status: 403 }
    );
  }

  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("full_url")
    .eq("order_id", orderId)
    .single();

  if (songError || !song?.full_url) {
    return NextResponse.json(
      { error: "El archivo aún no está disponible, intenta de nuevo en unos minutos" },
      { status: 404 }
    );
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("tracks")
    .createSignedUrl(song.full_url as string, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("Error generando URL firmada:", signError);
    return NextResponse.json(
      { error: "No se pudo generar el enlace de descarga" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    downloadUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
