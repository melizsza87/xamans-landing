import { recordEvent } from "@/lib/telemetry";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createCheckoutPreference,
  recoverCheckoutPreference,
} from "@/lib/mercadopago";
import { TIERS } from "@/lib/pricing";
import { authorizedOrder } from "@/lib/access";
import { jsonBody, failure, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const body = (await jsonBody(request)) as {
      orderId?: unknown;
      tier?: unknown;
    };
    if (
      typeof body.orderId !== "string" ||
      !(await authorizedOrder(body.orderId))
    )
      throw new HttpError(404, "Pedido no disponible.");
    // Keep unimplemented benefits off sale. Never silently change an approved tier.
    if (body.tier !== "premium")
      throw new HttpError(
        409,
        "Este paquete está pendiente de validación y aún no está a la venta.",
      );
    if (
      process.env.CHECKOUT_ENABLED !== "true" ||
      process.env.LEGAL_APPROVED !== "true"
    )
      throw new HttpError(503, "Los pagos están pendientes de validación.");
    const db = supabaseAdmin();
    const { data: order } = await db
      .from("orders")
      .select("*")
      .eq("id", body.orderId)
      .single();
    if (!order || order.status !== "preview")
      throw new HttpError(
        409,
        "Tu pedido aún no está listo para pagar o ya fue pagado.",
      );
    const { data: song } = await db
      .from("songs")
      .select("status,track_paths")
      .eq("order_id", order.id)
      .single();
    if (song?.status !== "ready" || song.track_paths.length !== 2)
      throw new HttpError(
        409,
        "Aún no están listas las dos versiones incluidas.",
      );
    const tier = TIERS.premium;
    if (order.mp_preference_id) {
      if (order.mp_preference_id === "creating")
        throw new HttpError(
          409,
          "El pago está en verificación. No volveremos a crearlo; intenta más tarde o contacta a soporte.",
        );
      if (order.tier !== "premium" || order.amount !== tier.amountCents)
        throw new HttpError(409, "El precio de este pedido requiere revisión.");
      const existing = await recoverCheckoutPreference(
        order.mp_preference_id,
        order.id,
        tier.amountCents,
      );
      return NextResponse.json({ checkoutUrl: existing.checkoutUrl });
    }
    // Single claim before network call: an ambiguous timeout is reviewed, never duplicated.
    const { data: claim, error } = await db
      .from("orders")
      .update({
        mp_preference_id: "creating",
        tier: "premium",
        amount: tier.amountCents,
      })
      .eq("id", order.id)
      .is("mp_preference_id", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Checkout claim failed");
    if (!claim) {
      // Another request may have completed between the initial read and claim.
      const { data: current } = await db
        .from("orders")
        .select("mp_preference_id,amount,tier,status")
        .eq("id", order.id)
        .single();
      if (
        current?.status === "preview" &&
        current.mp_preference_id &&
        current.mp_preference_id !== "creating" &&
        current.amount === tier.amountCents &&
        current.tier === "premium"
      ) {
        const existing = await recoverCheckoutPreference(
          current.mp_preference_id,
          order.id,
          tier.amountCents,
        );
        return NextResponse.json({ checkoutUrl: existing.checkoutUrl });
      }
      throw new HttpError(
        409,
        "El pago está en verificación. No volveremos a crearlo; intenta más tarde o contacta a soporte.",
      );
    }
    await recordEvent("checkout_start", order.brand);
    const preference = await createCheckoutPreference({
      orderId: order.id,
      title: `Cantalove — ${tier.name}`,
      amountCents: tier.amountCents,
    });
    const { error: saveError } = await db
      .from("orders")
      .update({ mp_preference_id: preference.preferenceId })
      .eq("id", order.id)
      .eq("mp_preference_id", "creating");
    if (saveError) throw new Error("Checkout persistence failed");
    return NextResponse.json({ checkoutUrl: preference.checkoutUrl });
  } catch (e) {
    return failure(e);
  }
}
