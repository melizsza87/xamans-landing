import Link from "next/link";
import { SamplePlayer } from "./SamplePlayer";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-noise">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-accent-soft font-semibold">
              Canciones personalizadas con IA
            </p>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-text">
              La canción que llevas años queriendo regalarle
            </h1>
            <p className="mt-6 text-base sm:text-lg text-text-muted max-w-xl">
              Cuéntanos su historia y en minutos tendrás una canción única,
              compuesta y cantada para esa persona. Sin estudios, sin
              compositores, sin esperas — sólo una serenata que nunca antes
              existió.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-4">
              <Link
                href="/crear"
                className="inline-flex justify-center items-center rounded-full bg-accent hover:bg-accent-soft transition-colors px-8 py-4 text-sm sm:text-base font-semibold text-text"
              >
                Crear mi canción
              </Link>
              <a
                href="#precios"
                className="inline-flex justify-center items-center rounded-full border border-white/15 hover:border-white/35 transition-colors px-8 py-4 text-sm sm:text-base font-semibold text-text"
              >
                Ver precios
              </a>
            </div>
          </div>

          <SamplePlayer />
        </div>
      </div>
    </section>
  );
}
