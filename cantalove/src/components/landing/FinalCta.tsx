import Link from "next/link";

export function FinalCta() {
  return (
    <section className="border-t border-white/10 bg-noise">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl text-text">
          Todavía estás a tiempo de regalarle algo que nadie más le ha dado
        </h2>
        <p className="mt-4 text-text-muted">
          Toma cinco minutos. El resto lo hace la música.
        </p>
        <Link
          href="/crear"
          className="mt-9 inline-flex justify-center items-center rounded-full bg-accent hover:bg-accent-soft transition-colors px-9 py-4 text-base font-semibold text-text"
        >
          Crear mi canción ahora
        </Link>
      </div>
    </section>
  );
}
