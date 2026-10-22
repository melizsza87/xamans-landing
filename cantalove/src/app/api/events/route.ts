import { authorizedOrder } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { jsonBody, failure, HttpError } from "@/lib/http";
import { recordEvent } from "@/lib/telemetry";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as {
      event?: unknown;
      brand?: unknown;
      orderId?: unknown;
    };
    if (
      typeof body.event !== "string" ||
      !["visit", "form_start", "form_complete", "play", "error"].includes(
        body.event,
      ) ||
      !["love", "heartbreak"].includes(String(body.brand))
    )
      throw new HttpError(400, "Evento inválido.");
    if (body.event === "play" && typeof body.orderId === "string") {
      if (!(await authorizedOrder(body.orderId)))
        throw new HttpError(404, "Pedido no disponible.");
      await supabaseAdmin()
        .from("orders")
        .update({ first_play_at: new Date().toISOString() })
        .eq("id", body.orderId)
        .is("first_play_at", null);
    }
    await rateLimit("events-global", 3000, 3600);
    await recordEvent(body.event, String(body.brand));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return failure(e);
  }
}
