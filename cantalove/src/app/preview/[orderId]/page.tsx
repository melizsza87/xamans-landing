import { notFound } from "next/navigation";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { PreviewClient } from "@/components/preview/PreviewClient";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function PreviewPage({
  params,
}: PageProps<"/preview/[orderId]">) {
  const { orderId } = await params;
  const supabase = supabaseAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const [{ data: song }, { data: personalization }] = await Promise.all([
    supabase
      .from("songs")
      .select("preview_url, lyrics, status")
      .eq("order_id", orderId)
      .single(),
    supabase
      .from("personalizations")
      .select("names")
      .eq("order_id", orderId)
      .single(),
  ]);

  const names = personalization?.names || "";

  return (
    <div className="flex flex-col flex-1">
      <Nav />
      <main className="flex-1 bg-noise">
        <div className="mx-auto max-w-4xl px-6 pt-32 pb-24">
          {song?.status === "ready" && song.preview_url ? (
            <PreviewClient
              orderId={orderId}
              previewUrl={song.preview_url}
              lyrics={song.lyrics || ""}
              names={names}
            />
          ) : song?.status === "failed" || order.status === "failed" ? (
            <div className="text-center py-24">
              <h1 className="font-display text-3xl text-text">
                Hubo un problema generando tu canción
              </h1>
              <p className="mt-3 text-text-muted">
                Intenta crear tu canción de nuevo desde el formulario.
              </p>
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="mx-auto h-12 w-12 rounded-full border-2 border-white/15 border-t-accent animate-spin" />
              <h1 className="mt-8 font-display text-3xl text-text">
                Tu canción todavía se está terminando de producir
              </h1>
              <p className="mt-3 text-text-muted">
                Recarga esta página en un momento.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
