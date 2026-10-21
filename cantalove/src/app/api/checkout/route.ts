import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { TIERS } from "@/lib/pricing";
import type { Tier } from "@/lib/types";

interface CheckoutBody {
  orderId: string;
  tier: Tier;
}

function isValidBody(body: unknown): body is CheckoutBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.orderId === "string" &&
    b.orderId.trim().length > 0 &&
    typeof b.tier === "string" &&
    b.tier in TIERS
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
      { error: "Faltan campos requeridos: orderId, tier" },
      { status: 400 }
    );
  }

  const { orderId, tier } = body;
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  // VIP needs stems and manual revisions, not implemented in the MVP.
  if (tier === "vip") return NextResponse.json({ error: "VIP estará disponible próximamente" }, { status: 400 });
  if (order.status !== "preview") return NextResponse.json({ error: "La canción todavía no está lista para pago" }, { status: 409 });
  if (tier === "premium") {
    const { data: song } = await supabase.from("songs").select("alternate_url").eq("order_id", orderId).single();
    if (!song?.alternate_url) return NextResponse.json({ error: "Premium requiere dos versiones musicales." }, { status: 409 });
  }
  const tierInfo = TIERS[tier];

  try {
    const { checkoutUrl, preferenceId } = await createCheckoutPreference({
      orderId,
      title: `cantalove — Canción personalizada (${tierInfo.name})`,
      amountCents: tierInfo.amountCents,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tier,
        amount: tierInfo.amountCents,
        mp_preference_id: preferenceId,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error actualizando orden:", updateError);
      return NextResponse.json(
        { error: "No se pudo actualizar la orden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("Error creando preferencia de MercadoPago:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar el pago" },
      { status: 502 }
    );
  }
}
