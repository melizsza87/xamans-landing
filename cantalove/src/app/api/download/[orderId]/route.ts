import { recordOrderEvent } from "@/lib/telemetry";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizedOrder } from "@/lib/access";
import { failure, HttpError } from "@/lib/http";
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/download/[orderId]">,
) {
  try {
    const { orderId } = await params;
    if (!(await authorizedOrder(orderId)))
      throw new HttpError(404, "Verifica tu correo para acceder al pedido.");
    const db = supabaseAdmin();
    const { data: order } = await db
      .from("orders")
      .select("status,payment_status")
      .eq("id", orderId)
      .single();
    if (
      !order ||
      !["paid", "delivered"].includes(order.status) ||
      order.payment_status !== "approved"
    )
      throw new HttpError(403, "El pago aún no está confirmado.");
    const version = new URL(request.url).searchParams.get("version") ?? "0";
    if (!/^[01]$/.test(version)) throw new HttpError(400, "Versión inválida.");
    const { data: song } = await db
      .from("songs")
      .select("track_paths")
      .eq("order_id", orderId)
      .single();
    const path = song?.track_paths[Number(version)];
    if (!path || path !== `${orderId}/${version}.mp3`)
      throw new HttpError(404, "El archivo aún no está disponible.");
    const { data, error } = await db.storage
      .from("tracks")
      .createSignedUrl(path, 60, {
        download: `cantalove-version-${Number(version) + 1}.mp3`,
      });
    if (error || !data) throw new Error("Download signing failed");
    await db
      .from("orders")
      .update({ first_download_grant_at: new Date().toISOString() })
      .eq("id", orderId)
      .is("first_download_grant_at", null);
    await recordOrderEvent("download", orderId);
    return NextResponse.json(
      { downloadUrl: data.signedUrl, expiresIn: 60 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
