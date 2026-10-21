import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[orderId]">
) {
  const { orderId } = await params;
  const variant = new URL(_request.url).searchParams.get("version");
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, tier")
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
    .select("full_url, alternate_file")
    .eq("order_id", orderId)
    .single();

  if (songError || !song?.full_url) {
    return NextResponse.json(
      { error: "El archivo aún no está disponible, intenta de nuevo en unos minutos" },
      { status: 404 }
    );
  }

  if (variant === "alternate" && order.tier !== "premium") {
    return NextResponse.json({ error: "Versión alternativa no incluida" }, { status: 403 });
  }
  const path = variant === "alternate" ? song.alternate_file : song.full_url;
  if (!path) return NextResponse.json({ error: "La segunda versión aún no está disponible" }, { status: 404 });
  const { data: signed, error: signError } = await supabase.storage
    .from("tracks")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

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
