import { notFound } from "next/navigation";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { DescargaClient } from "@/components/descarga/DescargaClient";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function DescargaPage({
  params,
}: PageProps<"/descarga/[orderId]">) {
  const { orderId } = await params;
  const supabase = supabaseAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, tier")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const isPaid = order.status === "paid" || order.status === "delivered";

  const { data: personalization } = await supabase
    .from("personalizations")
    .select("names")
    .eq("order_id", orderId)
    .single();

  const names = personalization?.names || "";

  return (
    <div className="flex flex-col flex-1">
      <Nav />
      <main className="flex-1 bg-noise">
        <div className="mx-auto max-w-xl px-6 pt-32 pb-24 text-center">
          {isPaid ? (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-accent-soft font-semibold">
                Pago confirmado
              </p>
              <h1 className="mt-4 font-display text-3xl sm:text-4xl text-text">
                Tu canción para {names} ya está lista
              </h1>
              <p className="mt-4 text-text-muted">
                Gracias por regalar algo que nadie más podrá regalar. Aquí
                tienes tu canción completa, lista para compartir.
              </p>

              <div className="mt-10">
                <DescargaClient
                  orderId={orderId}
                  names={names}
                  showLyricsPdf={order.tier === "premium" || order.tier === "vip"}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-accent-soft font-semibold">
                Esperando confirmación
              </p>
              <h1 className="mt-4 font-display text-3xl text-text">
                Todavía no confirmamos tu pago
              </h1>
              <p className="mt-4 text-text-muted">
                En cuanto MercadoPago confirme el pago, esta página se
                actualizará automáticamente con tu descarga. Si ya pagaste,
                recarga en unos segundos.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
