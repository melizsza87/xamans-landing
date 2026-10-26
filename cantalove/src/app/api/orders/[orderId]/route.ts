import { NextResponse } from "next/server";
import { authorizedOrder } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { failure, HttpError } from "@/lib/http";
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/orders/[orderId]">,
) {
  try {
    const { orderId } = await params;
    if (!(await authorizedOrder(orderId)))
      throw new HttpError(404, "Pedido no disponible.");
    const db = supabaseAdmin();
    const [{ data: order, error }, { data: song }] = await Promise.all([
      db
        .from("orders")
        .select("status,payment_status")
        .eq("id", orderId)
        .single(),
      db
        .from("songs")
        .select("status,apiframe_job_id,lyrics")
        .eq("order_id", orderId)
        .single(),
    ]);
    if (error) throw new Error("Order unavailable");
    return NextResponse.json(
      { order, song },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
