import Link from "next/link";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { DescargaClient } from "@/components/descarga/DescargaClient";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizedOrder } from "@/lib/access";
export default async function DescargaPage({
  params,
}: PageProps<"/descarga/[orderId]">) {
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
  const { data: order } = await supabaseAdmin()
    .from("orders")
    .select("status,payment_status,brand,tier")
    .eq("id", orderId)
    .single();
  const paid =
    !!order &&
    ["paid", "delivered"].includes(order.status) &&
    order.payment_status === "approved";
  return (
    <div
      className={`brand-shell ${order?.brand === "heartbreak" ? "heartbreak" : ""}`}
    >
      <Nav brand={order?.brand} />
      <main className="wrap order-page">
        <h1>
          {paid ? "Tu canción está lista para llevar." : "Estado de tu pedido"}
        </h1>
        <DescargaClient
          orderId={orderId}
          showLyricsPdf={order?.tier === "premium"}
          paid={paid}
        />
        <Link href={`/preview/${orderId}`}>Volver a escuchar</Link>
      </main>
      <Footer brand={order?.brand} />
    </div>
  );
}
