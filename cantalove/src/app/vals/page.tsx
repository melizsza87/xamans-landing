import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canción personalizada para vals de boda | Cantalove",
  description: "Crea una canción original para el primer baile de los novios o para un vals especial con mamá o papá. Tu historia hecha música.",
};

const dances = [
  {
    title: "Vals de pareja",
    subtitle: "Nuestro primer baile",
    copy: "Una canción que cuenta cómo comenzó su historia y celebra el amor que los trae hasta aquí.",
    icon: "♡",
    href: "/crear?occasion=Boda%2FVals",
  },
  {
    title: "Vals con mamá",
    subtitle: "Gracias por tanto, mamá",
    copy: "Un homenaje a los recuerdos, la complicidad y todo lo que quieres agradecerle.",
    icon: "✿",
    href: "/crear?occasion=Boda%2FVals%20con%20mam%C3%A1",
  },
  {
    title: "Vals con papá",
    subtitle: "Un baile para recordar",
    copy: "Una canción sobre su historia, sus enseñanzas y lo que este momento significa para ti.",
    icon: "♫",
    href: "/crear?occasion=Boda%2FVals%20con%20pap%C3%A1",
  },
];

export default function WeddingWaltzPage() {
  return (
    <div className="rev-site rev-love wedding-site">
      <header className="rev-header">
        <Link href="/" className="rev-logo" aria-label="Cantalove inicio">
          canta<span>love</span>
        </Link>
        <Link href="/" className="wedding-back">← Volver a Cantalove</Link>
      </header>
      <main>
        <section className="wedding-intro">
          <div className="wedding-intro-copy">
            <span className="rev-kicker">BODA · VALS · RECUERDOS</span>
            <h1>Hay bailes que merecen <em>su propia canción.</em></h1>
            <p>Desde el primer baile de los novios hasta ese momento inolvidable con mamá o papá. Cuéntanos la historia y la convertimos en música.</p>
            <a href="#elige-tu-vals" className="rev-button">Elegir mi vals <span aria-hidden="true">↓</span></a>
          </div>
          <div className="wedding-intro-photo" role="img" aria-label="Pareja de recién casados celebrando su boda" />
        </section>
        <section id="elige-tu-vals" className="wedding-options">
          <span className="rev-kicker">TRES MANERAS DE VIVIR ESTE MOMENTO</span>
          <h2>¿Con quién quieres bailar?</h2>
          <div className="wedding-option-grid">
            {dances.map((dance) => (
              <Link href={dance.href} key={dance.title} className="wedding-option">
                <span className="wedding-option-icon" aria-hidden="true">{dance.icon}</span>
                <span className="wedding-option-subtitle">{dance.subtitle}</span>
                <h3>{dance.title}</h3>
                <p>{dance.copy}</p>
                <span className="wedding-option-link">Crear esta canción <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
          <p className="wedding-note">Cada vals se personaliza con los nombres, recuerdos, estilo musical y voz que elijas. Puedes escuchar la canción antes de comprarla.</p>
        </section>
      </main>
      <footer className="rev-footer">
        <Link href="/" className="rev-logo">canta<span>love</span></Link>
        <span>Hecho para momentos que duran toda la vida.</span>
        <Link href="/">Volver al inicio →</Link>
      </footer>
    </div>
  );
}
