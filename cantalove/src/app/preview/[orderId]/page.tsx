import { notFound } from "next/navigation";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PreviewClient } from "@/components/preview/PreviewClient";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizedOrder } from "@/lib/access";
import Link from "next/link";
export default async function PreviewPage({
  params,
}: PageProps<"/preview/[orderId]">) {
  const { orderId } = await params;
  if (!(await authorizedOrder(orderId)))
    return (
      <main className="wrap order-page">
        <h1>Tu canción es privada.</h1>
        <Link className="solid" href="/recuperar">
          Verificar mi correo y recuperar pedido
        </Link>
      </main>
    );
  const db = supabaseAdmin();
  const [{ data: order }, { data: song }, { data: brief }] = await Promise.all([
    db
      .from("orders")
      .select("status,payment_status,brand")
      .eq("id", orderId)
      .single(),
    db
      .from("songs")
      .select("lyrics,status,apiframe_job_id,track_paths")
      .eq("order_id", orderId)
      .single(),
    db
      .from("personalizations")
      .select("names")
      .eq("order_id", orderId)
      .single(),
  ]);
  if (!order) notFound();
  return (
    <div
      className={`brand-shell ${order?.brand === "heartbreak" ? "heartbreak" : ""}`}
    >
      <Nav brand={order?.brand} />
      <PreviewClient
        brand={order.brand}
        orderId={orderId}
        names={brief?.names ?? ""}
        lyrics={song?.lyrics ?? ""}
        ready={song?.status === "ready" && song.track_paths.length === 2}
        jobId={song?.apiframe_job_id ?? null}
        failed={order.status === "failed" || song?.status === "failed"}
        paymentStatus={
          ["paid", "delivered"].includes(order.status)
            ? order.status
            : order.payment_status
        }
      />
      <Footer brand={order?.brand} />
    </div>
  );
}
