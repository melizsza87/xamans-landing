import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizedOrder } from "@/lib/access";
import { failure, HttpError } from "@/lib/http";
import { lyricsPdf } from "@/lib/lyrics-pdf";
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/download/[orderId]/lyrics">,
) {
  try {
    const { orderId } = await params;
    if (!(await authorizedOrder(orderId)))
      throw new HttpError(404, "Verifica tu correo para acceder al pedido.");
    const db = supabaseAdmin();
    const { data: order } = await db
      .from("orders")
      .select("status,tier,payment_status")
      .eq("id", orderId)
      .single();
    if (
      !order ||
      !["paid", "delivered"].includes(order.status) ||
      order.payment_status !== "approved" ||
      order.tier !== "premium"
    )
      throw new HttpError(403, "El PDF requiere un pago Premium confirmado.");
    const [{ data: song }, { data: brief }] = await Promise.all([
      db.from("songs").select("lyrics").eq("order_id", orderId).single(),
      db
        .from("personalizations")
        .select("names")
        .eq("order_id", orderId)
        .single(),
    ]);
    if (!song?.lyrics) throw new HttpError(404, "Letra no disponible.");
    return new NextResponse(
      Buffer.from(await lyricsPdf(brief?.names ?? "", song.lyrics)),
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="cantalove-letra-${orderId}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
