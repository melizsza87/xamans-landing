import Link from "next/link";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

export const metadata = {
  title: "cantalovergas | La última palabra es tuya",
  description: "Canciones originales de despecho con inteligencia artificial. Tu historia, tu género, tu despedida.",
};

export default function Despecho() {
  return <div className="min-h-screen bg-[#100b0d] text-white">
    <Nav />
    <main className="mx-auto max-w-5xl px-6 pb-28 pt-40">
      <p className="text-sm uppercase tracking-[.35em] text-[#fb7185]">Cantalovergas · por Cantalove</p>
      <h1 className="mt-6 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
        Hay amores que terminan. <span className="text-[#f87171]">Y canciones que apenas comienzan.</span>
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-white/70">
        ¿Te rompieron el corazón? Cuenta lo que pasó, elige tu ritmo, y convierte esa historia en una canción de despecho única. Con humor, sin amenazas, sin dedicarle tu paz a nadie.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link className="rounded-full bg-red-600 px-8 py-4 font-semibold hover:bg-red-500" href="/crear/despecho">
          Mi himno de despecho
        </Link>
        <Link className="rounded-full border border-white/25 px-8 py-4 hover:border-white/70" href="/">
          Prefiero una de amor
        </Link>
      </div>
      <section className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          ["01", "Cuéntanos qué pasó", "El plot twist, esa frase inolvidable, lo que aprendiste"],
          ["02", "Elige tu mood", "Corrido tumbado, ranchera, banda, pop y más"],
          ["03", "Escúchala gratis", "Si te gusta, elige el paquete para descargarla"]
        ].map(([n,t,d]) =>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-7" key={n}>
            <span className="text-3xl font-display text-red-400">{n}</span>
            <h2 className="mt-4 text-lg font-semibold">{t}</h2>
            <p className="mt-2 text-white/60">{d}</p>
          </div>
        )}
      </section>
    </main>
    <Footer />
  </div>;
}