"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CrearForm, type Brand } from "@/components/crear/CrearForm";
import { Footer } from "@/components/ui/Footer";

const copy = {
  love: {
    eyebrow: "Regalos que se sienten",
    title: (
      <>
        Cada historia merece <em>su canción.</em>
      </>
    ),
    text: "Hay cosas que no caben en un mensaje. Cuéntanos sus nombres, los recuerdos y eso que hace única su historia. Nosotros te ayudamos a convertirlo en una canción para recordar.",
    cta: "Quiero crear una canción ↗",
    album: (
      <>
        Lo nuestro
        <br />
        siempre
        <br />
        suena.
      </>
    ),
    caption: "EDICIÓN PARA ALGUIEN ESPECIAL",
    tag: "♡ La canción de su historia",
    altTitle: "¿Y si la historia no terminó bien?",
    altText: "Para despedidas épicas existe nuestro lado sin filtro.",
    altCTA: "Conoce cantalovergas ↗",
    closingTitle:
      "Eso que siempre has querido decir, ahora puede tener música.",
    closingText:
      "Las mejores canciones no empiezan con una nota. Empiezan con una historia que merece contarse.",
  },
  heartbreak: {
    eyebrow: "Despecho con soundtrack propio",
    title: (
      <>
        Si te rompieron el corazón, <em>que suene fuerte.</em>
      </>
    ),
    text: "No todas las historias necesitan final feliz. Algunas necesitan una rola de despedida, una ranchera con carácter o un corrido para cerrar el capítulo con estilo.",
    cta: "Crear mi rolón de despecho ↗",
    album: (
      <>
        Te superé.
        <br />
        (Casi.)
      </>
    ),
    caption: "EDICIÓN SIN FILTRO",
    tag: "🔥 La última palabra es tuya",
    altTitle: "¿Y si prefieres una canción de amor?",
    altText: "También tenemos música para los momentos que sí quieres repetir.",
    altCTA: "Volver a cantalove ↗",
    closingTitle: "Que tu próxima etapa tenga mejor música.",
    closingText:
      "Hay cosas que se superan mejor cuando puedes cantarlas a todo volumen.",
  },
};
const occasions = [
  ["Aniversario", "💌", "Aniversarios"],
  ["Boda", "🥂", "Bodas"],
  ["Mamá o papá", "🌷", "Para mamá o papá"],
  ["Cumpleaños", "🎂", "Cumpleaños"],
  ["Amistad", "✨", "Amistad"],
  ["Otra ocasión", "🎶", "Tu historia"],
];
export function BrandLanding({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState(initialBrand);
  const [spinning, setSpinning] = useState(false);
  const [occasion, setOccasion] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const d = copy[brand];
  useEffect(() => {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "visit", brand }),
    }).catch(() => {});
  }, [brand]);
  function switchBrand() {
    const next = brand === "love" ? "heartbreak" : "love";
    setBrand(next);
    setSpinning(false);
    window.history.replaceState(null, "", next === "love" ? "/" : "/rgas");
    document.title =
      (next === "love" ? "Cantalove" : "Cantalovergas") +
      " | Tu historia hecha canción";
  }
  function open(type?: string) {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "form_start", brand }),
    }).catch(() => {});
    returnFocus.current = document.activeElement as HTMLElement;
    setOccasion(type || (brand === "love" ? "Aniversario" : "Despecho"));
  }
  function close() {
    setOccasion(null);
    returnFocus.current?.focus();
  }
  useEffect(() => {
    if (occasion === null) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOccasion(null);
        returnFocus.current?.focus();
      }
      if (e.key !== "Tab") return;
      const nodes = dialog.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]),input:not([disabled]),select,textarea,a[href]",
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", handle);
    };
  }, [occasion]);
  return (
    <div
      className={`brand-shell ${brand === "heartbreak" ? "heartbreak" : ""}`}
    >
      <header className="wrap nav">
        <Link href="/" className="logo" aria-label="Inicio de Cantalove">
          canta<b>{brand === "love" ? "love" : "lovergas"}</b>
          <span aria-hidden="true"> ♡</span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#como">Cómo funciona</a>
          <a href="#ocasiones">Ocasiones</a>
          <a href="#precios">Paquetes</a>
        </nav>
        <div className="nav-right">
          <button className="nav-switch" onClick={switchBrand}>
            {brand === "love" ? "¿Corazón roto? ↗" : "¿Te enamoraste? ↗"}
          </button>
          <button className="solid" onClick={() => open()}>
            Crear canción ↗
          </button>
        </div>
      </header>
      <main>
        <div className="wrap hero" id="inicio">
          <div>
            <span className="eyebrow">{d.eyebrow}</span>
            <h1>{d.title}</h1>
            <p className="hero-copy">{d.text}</p>
            <div className="hero-actions">
              <button className="solid" onClick={() => open()}>
                {d.cta}
              </button>
              <a className="outline" href="#como">
                Descubre cómo funciona
              </a>
            </div>
            <p className="hero-note">
              <span>✦</span> Tú pones la historia. La tecnología pone la música.
            </p>
          </div>
          <div
            className="art"
            aria-label="Ilustración de una portada de disco y un vinilo"
          >
            <span className="spark" aria-hidden="true">
              ✧
            </span>
            <div className={`record ${spinning ? "playing" : ""}`}>
              <div className="labeldisc">
                canta
                <br />
                {brand === "love" ? "love" : "l🔥ve"}
              </div>
            </div>
            <div className="cover">
              <small>UNA HISTORIA HECHA MÚSICA</small>
              <strong>{d.album}</strong>
              <span>{d.caption}</span>
            </div>
            <div className="floating">{d.tag}</div>
            <button
              className="disc-control"
              aria-pressed={spinning}
              onClick={() => setSpinning(!spinning)}
            >
              Girar vinilo decorativo ↻
            </button>
          </div>
        </div>
        <div className="subnav">
          <div className="wrap">
            <span>
              <b>✧</b> Escrita a partir de tus recuerdos
            </span>
            <span>
              <b>♡</b> Una canción hecha a tu manera
            </span>
            <span>
              <b>♫</b> Escucha antes de decidir
            </span>
            <span>
              <b>↗</b> Lista para regalar
            </span>
          </div>
        </div>
        <section id="como">
          <div className="wrap">
            <span className="eyebrow">Así de fácil</span>
            <h2>De una historia a una canción, en tres pasos.</h2>
            <p className="section-intro">
              No necesitas saber escribir canciones ni tocar un instrumento.
              Solo necesitas una historia que valga la pena contar.
            </p>
            <div className="steps">
              {[
                [
                  "01",
                  "Cuéntanos",
                  "Comparte nombres, recuerdos, frases especiales y el momento que quieres celebrar.",
                ],
                [
                  "02",
                  "Dale su sonido",
                  "Elige el género musical y el sentimiento que quieres transmitir.",
                ],
                [
                  "03",
                  "Escucha y decide",
                  "Escucha el resultado. Si te encanta, elige cómo conservarlo y compartirlo.",
                ],
              ].map(([n, title, text]) => (
                <div className="step" key={n}>
                  <div className="num">{n}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="ocasiones" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <span className="eyebrow">Cualquier momento especial</span>
            <h2>No hay dos historias iguales.</h2>
            <p className="section-intro">
              Y tampoco deberían sonar igual. Empieza por la ocasión que hoy
              quieres convertir en recuerdo.
            </p>
            <div className="occasions">
              {occasions.map(([value, emoji, title]) => (
                <button
                  className="occasion"
                  key={title}
                  onClick={() => open(value)}
                >
                  <span className="emoji" aria-hidden="true">
                    {emoji}
                  </span>
                  <strong>{title}</strong>
                  <span className="arrow">↗</span>
                </button>
              ))}
            </div>
            <div className="breakout">
              <div>
                <h3>{d.altTitle}</h3>
                <p>{d.altText}</p>
              </div>
              <button
                className="solid"
                onClick={() => {
                  switchBrand();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {d.altCTA}
              </button>
            </div>
          </div>
        </section>
        <section id="precios">
          <div className="wrap">
            <span className="eyebrow">Tu historia hecha música</span>
            <h2>Una canción. Varias maneras de hacerla especial.</h2>
            <p className="section-intro">
              Escucha tu canción completa antes de decidir. Una generación
              gratuita por correo verificado.
            </p>
            <div className="prices">
              <article className="price">
                <span className="chip">PARA EMPEZAR</span>
                <h3>Básico · Solo música</h3>
                <div className="amount">
                  $249 <small>MXN</small>
                </div>
                <p>
                  Una pieza instrumental personalizada para acompañar un
                  momento.
                </p>
                <ul>
                  <li>1 versión instrumental</li>
                  <li>Archivo MP3</li>
                  <li>Uso personal sujeto a licencia</li>
                </ul>
                <button className="outline" disabled>
                  Próximamente
                </button>
              </article>
              <article className="price featured">
                <span className="chip">EL REGALO FAVORITO</span>
                <h3>Premium · Nuestra canción</h3>
                <div className="amount">
                  $449 <small>MXN</small>
                </div>
                <p>Tu historia convertida en letra y música para dedicar.</p>
                <ul>
                  <li>Letra basada en tus recuerdos</li>
                  <li>2 versiones para elegir</li>
                  <li>MP3 + letra en PDF</li>
                </ul>
                <button className="solid" onClick={() => open()}>
                  Escuchar mi canción primero ↗
                </button>
              </article>
              <article className="price">
                <span className="chip">PARA GRANDES MOMENTOS</span>
                <h3>VIP · Gran momento</h3>
                <div className="amount">
                  $899 <small>MXN</small>
                </div>
                <p>
                  Una experiencia para bodas, celebraciones y ocasiones
                  importantes.
                </p>
                <ul>
                  <li>Paquete en preparación</li>
                  <li>Prestaciones por confirmar</li>
                  <li>Venta todavía no disponible</li>
                </ul>
                <button className="outline" disabled>
                  Próximamente
                </button>
              </article>
            </div>
            <p className="pricing-note">
              La duración elegida es orientativa. Básico y VIP estarán
              disponibles cuando podamos garantizar todas sus prestaciones.
            </p>
          </div>
        </section>
        <section className="closing">
          <div className="wrap">
            <span className="eyebrow">Aquí empieza la canción</span>
            <h2>{d.closingTitle}</h2>
            <p>{d.closingText}</p>
            <button className="solid" onClick={() => open()}>
              Empezar mi historia ↗
            </button>
          </div>
        </section>
      </main>
      <Footer brand={brand} />
      {occasion !== null && (
        <div
          className="overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="modal"
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
          >
            <button
              className="close"
              aria-label="Cerrar formulario"
              onClick={close}
            >
              ×
            </button>
            <CrearForm
              brand={brand}
              initialOccasion={occasion}
              onCancel={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
