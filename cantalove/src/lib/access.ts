import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { UUID } from "@/lib/validation";
export const SESSION_COOKIE = "cantalove_session";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function sessionEmail(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await supabaseAdmin()
    .from("customer_sessions")
    .select("email")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("Session lookup failed");
  return data?.email ?? null;
}
export async function authorizedOrder(orderId: string): Promise<boolean> {
  if (!UUID.test(orderId)) return false;
  const email = await sessionEmail();
  if (!email) return false;
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("contact_email", email)
    .maybeSingle();
  if (error) throw new Error("Ownership lookup failed");
  return !!data;
}
