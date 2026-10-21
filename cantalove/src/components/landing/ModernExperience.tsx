import Link from "next/link";
import type { CSSProperties } from "react";

type OccasionCard = { name: string; desc: string; img: string; href: string };
const loveCards: OccasionCard[] = [
  { name: "Amor", desc: "Cuando las palabras se quedan cortas", img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80", href: "/crear?occasion=Aniversario" },
  { name: "Boda / Vals", desc: "La canción de su primer baile", img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80", href: "/crear?occasion=Boda%2FVals" },
  { name: "Celebración", desc: "Cumpleaños y momentos especiales", img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80", href: "/crear?occasion=Cumpleaños" },
  { name: "Familia", desc: "El amor en todas sus formas", img: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80", href: "/crear?occasion=Día%20de%20las%20Madres" },
];
const heartbreakCards: OccasionCard[] = [
  { name: "Ex tóxico", desc: "Para cerrar el capítulo", img: "https://images.unsplash.com/photo-1533038590840-1cde6fa4e1a6?auto=format&fit=crop&w=900&q=80", href: "/crear/despecho" },
  { name: "Me mintió", desc: "Para decir lo que no dijiste", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80", href: "/crear/despecho" },
  { name: "Tequila y despecho", desc: "La cantamos, brindamos y seguimos", img: "https://unsplash.com/photos/a-man-sitting-at-a-table-with-a-bottle-of-alcohol-1WDKJW0R_8A/download?w=900", href: "/crear/despecho" },
  { name: "Ahora estoy mejor", desc: "Porque seguir adelante también se canta", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80", href: "/crear/despecho" },
];

const steps = [
  ["01", "Cuéntanos la historia", "Deja que los detalles hagan única la letra."],
  ["02", "Elige tu estilo", "Género musical, voz y ocasión."],
  ["03", "Escucha tu canción", "Conoce el resultado antes de comprar."],
  ["04", "Guárdala o compártela", "Descarga el MP3 o comparte un enlace anónimo."],
];

const plans = [
  { name: "Básico", amount: "$249", description: "Tu historia hecha canción", perks: ["1 canción original", "Letra personalizada", "MP3 después del pago"] },
  { name: "Premium", amount: "$449", description: "Dos maneras de contarla", perks: ["2 versiones, si ambas están disponibles", "Archivos MP3", "PDF con la letra"] },
];

export function ModernExperience({ mode }: { mode: "love" | "breakup" }) {
  const sad = mode === "breakup";
  const cards = sad ? heartbreakCards : loveCards;
  const create = sad ? "/crear/despecho" : "/crear";
  const other = sad ? "/" : "/rgas";
  const heroPhoto = sad
    ? "https://unsplash.com/photos/a-man-sitting-at-a-table-with-a-bottle-of-alcohol-1WDKJW0R_8A/download?w=1400"
    : "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1500&q=84";
  const photoStyle = (url: string): CSSProperties => ({ backgroundImage: "url('" + url + "')" });
  return (
    <div className={sad ? "modern-site breakup-site" : "modern-site love-site"}>
      <header className="modern-nav">
        <Link className="modern-logo" href={sad ? "/rgas" : "/"} aria-label={sad ? "Inicio Cantalovergas" : "Inicio Cantalove"}>
          canta<span>{sad ? "lovergas" : "love"}</span>
        </Link>
        <nav aria-label="Navegación principal" className="modern-desktop-nav">
          <a href="#momentos">{sad ? "Historias" : "Ocasiones"}</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#precios">Precios</a>
          <a href="#anonimo">Envío anónimo</a>
        </nav>
        <Link className="modern-nav-cta" href={create}>Crear mi canción <span aria-hidden="true">↗</span></Link>
      </header>

      <main>
        <section className="modern-hero">
          <div className="modern-hero-copy">
            <span className="modern-eyebrow">{sad ? "TU DESPECHO TAMBIÉN MERECE BANDA SONORA" : "UNA HISTORIA QUE MERECE SONAR"}</span>
            {sad
              ? <h1>Lo que duele, <em>también se canta.</em></h1>
              : <h1>Tu historia, <em>en una canción.</em></h1>}
            <p>{sad
              ? "Convierte ese capítulo, ese coraje o esa carcajada en una canción original. Sin dedicarle otra lágrima."
              : "Convierte los momentos que importan en una canción personal. Para regalar amor, celebrar una boda o guardar un recuerdo."}</p>
            <div className="modern-actions">
              <Link className="modern-cta" href={create}>Crear mi canción <span aria-hidden="true">→</span></Link>
              <a href="#como-funciona" className="modern-text-link">Descubre cómo funciona <span aria-hidden="true">↗</span></a>
            </div>
            <div className="modern-trust">
              <span>♪ Canción personalizada</span><span>♡ Escucha antes de comprar</span><span>↗ Envío anónimo opcional</span>
            </div>
          </div>
          <div className="modern-hero-photo" style={photoStyle(heroPhoto)} role="img" aria-label={sad ? "Hombre disfrutando de tequila, inspirado en noches de despecho" : "Pareja en una celebración de boda, inspiración para un vals personalizado"}>
            <div className="modern-photo-label">{sad ? "Por lo que dolió. Y por lo que viene." : "Un vals para recordar toda la vida."}</div>
          </div>
        </section>

        <section className="modern-section modern-section-cards" id="momentos">
          <div className="modern-section-heading">
            <p className="modern-eyebrow">{sad ? "DE TODOS LOS CORAZONES ROTOS" : "PARA CADA MOMENTO"}</p>
            <h2>{sad ? "¿Qué historia vas a cantar?" : "¿Qué momento convertirás en canción?"}</h2>
            <p>{sad ? "Romperla en la pista también cuenta como superar." : "Hay un regalo para cada historia, y una canción para cada recuerdo."}</p>
          </div>
          <div className="modern-card-grid">
            {cards.map(card => <Link className="modern-photo-card" href={card.href} key={card.name}>
              <span className="modern-card-img" style={photoStyle(card.img)} aria-hidden="true" />
              <span className="modern-card-copy"><strong>{card.name}</strong><small>{card.desc}</small></span>
              <span className="modern-card-arrow" aria-hidden="true">↗</span>
            </Link>)}
          </div>
          <p className="modern-photo-note">Fotografías de referencia para ambientación. Las canciones de ejemplo se añadirán cuando estén disponibles.</p>
        </section>

        <section className="modern-section modern-steps" id="como-funciona">
          <div className="modern-section-heading"><p className="modern-eyebrow">FÁCIL Y PERSONAL</p><h2>Así de sencillo</h2></div>
          <div className="modern-steps-grid">{steps.map(([num,heading,desc]) => <div key={num} className="modern-step">
            <span className="modern-num">{num}</span><h3>{heading}</h3><p>{desc}</p>
          </div>)}</div>
        </section>

        <section className="modern-section modern-gift" id="anonimo">
          <div className="modern-gift-symbol" aria-hidden="true">{sad ? "✦" : "♡"}</div>
          <div>
            <p className="modern-eyebrow">¿QUIERES QUE SEA UN SECRETO?</p>
            <h2>Envíala de forma <em>anónima.</em></h2>
            <p>Después de comprar, puedes compartir un enlace que no identifica a quien lo envía. Tú decides cómo enviarlo por WhatsApp, mensaje o correo.</p>
            <p className="modern-gift-fine">Tu historia puede incluir nombres o pistas sobre tu identidad. Revísala antes de compartir. No se envían mensajes automáticos a terceros.</p>
          </div>
          <Link className="modern-cta" href={create}>Crear un regalo sorpresa →</Link>
        </section>

        <section className="modern-section modern-pricing" id="precios">
          <div className="modern-section-heading"><p className="modern-eyebrow">SIN SUSCRIPCIONES</p><h2>Elige cómo conservarla</h2>
          <p>Puedes escuchar tu canción antes de decidir si quieres comprar la descarga.</p></div>
          <div className="modern-prices">{plans.map((plan,i) => <div className={"modern-price-card "+(i===1?"modern-highlight":"")} key={plan.name}>
            <span className="modern-plan-label">{plan.name}</span><strong className="modern-amount">{plan.amount}<small> MXN</small></strong>
            <p>{plan.description}</p><ul>{plan.perks.map(t=><li key={t}>✓ {t}</li>)}</ul>
            <Link href={create} className="modern-price-cta">Crear mi canción →</Link>
          </div>)}</div>
          <p className="modern-price-note">Los paquetes solo se cobran cuando eliges comprar tu canción. Premium se ofrece si hay dos versiones disponibles.</p>
        </section>
        <section className="modern-end">
          <h2>{sad ? "Dale ritmo a tu nueva etapa." : "Tu historia merece su propia canción."}</h2>
          <Link href={create} className="modern-cta">Empezar a crear →</Link>
        </section>
      </main>
      <footer className="modern-footer">
        <Link href={sad ? "/rgas" : "/"} className="modern-logo">canta<span>{sad ? "lovergas" : "love"}</span></Link>
        <p>© {new Date().getFullYear()} Cantalove · Canciones personalizadas con IA</p>
        <Link href={other}>{sad ? "¿En modo amor? Ve a Cantalove →" : "¿Más despecho que amor? Ve a Cantalovergas →"}</Link>
      </footer>
    </div>
  );
}