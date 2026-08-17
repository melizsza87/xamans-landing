const OCCASIONS = [
  "San Valentín",
  "Día de las Madres",
  "Bodas",
  "XV Años",
  "Aniversario",
  "Cumpleaños",
  "Navidad",
];

export function OccasionPills() {
  return (
    <section className="border-y border-white/10 bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-text-muted mb-6">
          Para cada momento que merece una canción
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {OCCASIONS.map((occasion) => (
            <span
              key={occasion}
              className="rounded-full border border-white/15 px-5 py-2 text-sm text-text-muted hover:text-text hover:border-accent-soft/60 transition-colors"
            >
              {occasion}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
