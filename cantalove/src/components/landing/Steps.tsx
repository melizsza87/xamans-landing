const STEPS = [
  {
    number: "01",
    title: "Cuéntanos su historia",
    description:
      "Nombres, cómo se conocieron, momentos especiales, el género musical y la voz que imaginas.",
  },
  {
    number: "02",
    title: "La IA compone tu canción",
    description:
      "En minutos generamos una letra íntima y una producción musical completa, hecha a la medida.",
  },
  {
    number: "03",
    title: "Escucha, elige y regala",
    description:
      "Escucha el preview, elige tu tier y descarga la canción completa lista para compartir.",
  },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-display text-3xl sm:text-4xl text-center text-text">
        Tres pasos para un regalo inolvidable
      </h2>
      <div className="mt-16 grid gap-10 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number} className="text-center sm:text-left">
            <span className="font-display text-5xl text-accent/70">
              {step.number}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-text">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
