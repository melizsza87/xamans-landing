import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
export const metadata = { title: "Te han dedicado una canción | Cantalove", robots: { index: false, follow: false } };
export default async function RegaloPage({ params }: PageProps<"/regalo/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f]{48}$/.test(token)) notFound();
  const hash = createHash("sha256").update(token).digest("hex");
  const supabase = supabaseAdmin();
  const { data: share } = await supabase.from("anonymous_shares").select("order_id").eq("token_hash", hash).single();
  if (!share) notFound();
  const [{ data: order }, { data: song }] = await Promise.all([
    supabase.from("orders").select("status").eq("id", share.order_id).single(),
    supabase.from("songs").select("full_url").eq("order_id", share.order_id).single(),
  ]);
  if (!order || !["paid", "delivered"].includes(order.status) || !song?.full_url) notFound();
  const { data: signed, error } = await supabase.storage.from("tracks").createSignedUrl(song.full_url, 900);
  if (!signed || error) return <main className="mx-auto max-w-xl p-12 text-center"><h1>Esta canción no está disponible ahora.</h1><p>Inténtalo nuevamente más tarde.</p></main>;
  return <main className="min-h-screen bg-[#fff8f5] px-6 py-16 text-[#502731]">
    <div className="mx-auto max-w-lg rounded-3xl bg-white px-7 py-12 text-center shadow-xl shadow-rose-100">
      <p className="text-sm uppercase tracking-[.3em] text-[#d9315b]">Un regalo musical</p>
      <h1 className="mt-5 font-serif text-4xl">Alguien te dedicó una canción ♡</h1>
      <p className="mt-5 leading-relaxed text-[#81666f]">Te llegó de forma anónima. Hay historias que también se cuentan con música.</p>
      <audio controls preload="metadata" className="mx-auto mt-9 w-full" src={signed.signedUrl}>
        Tu navegador no permite reproducir audio.
      </audio>
      <p className="mt-5 text-xs leading-relaxed text-[#81666f]">La identidad de quien comparte no se muestra. El contenido de la canción podría dar pistas sobre esa persona.</p>
      <Link href="/" className="mt-9 inline-flex rounded-full bg-[#d9315b] px-6 py-3 font-semibold text-white">Crear mi propia canción →</Link>
      <p className="mt-8 text-xs text-[#81666f]">Si recibiste contenido inapropiado, <a className="underline" href="mailto:hola@cantalove.com?subject=Reporte%20de%20canci%C3%B3n%20an%C3%B3nima">repórtalo aquí</a>.</p>
    </div>
  </main>;
}