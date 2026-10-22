import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
// Only event name and brand. No email, order identifier, lyrics or history.
export const EVENTS = [
  "visit",
  "form_start",
  "form_complete",
  "generation_start",
  "generation_complete",
  "play",
  "checkout_start",
  "payment_approved",
  "download",
  "error",
] as const;
export async function recordEvent(event: string, brand = "love") {
  if (!EVENTS.includes(event as (typeof EVENTS)[number])) return;
  try {
    await supabaseAdmin()
      .from("funnel_events")
      .insert({ event, brand: brand === "heartbreak" ? "heartbreak" : "love" });
  } catch {
    /* Analytics must never break a purchase. */
  }
}

export async function recordOrderEvent(event: string, orderId: string) {
  try {
    const { data } = await supabaseAdmin()
      .from("orders")
      .select("brand")
      .eq("id", orderId)
      .single();
    if (data) await recordEvent(event, data.brand);
  } catch {}
}
