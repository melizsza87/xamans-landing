import { NextResponse } from "next/server";
import { sessionEmail } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { failure, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const email = await sessionEmail();
    if (!email)
      throw new HttpError(
        401,
        "Verifica tu correo para recuperar tus pedidos.",
      );
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .select("id,status,payment_status,created_at")
      .eq("contact_email", email)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error("Orders unavailable");
    return NextResponse.json(
      { orders: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
