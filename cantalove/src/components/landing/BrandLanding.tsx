"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CrearForm, type Brand } from "@/components/crear/CrearForm";
import { Footer } from "@/components/ui/Footer";

function Arrow({ circle = false }: { circle?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
      {circle && (
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      )}
      <path
        d="M9 16h13m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    music: (
      <>
        <path d="M10 24V9l18-4v15M10 13l18-4" />
        <ellipse cx="6" cy="25" rx="4" ry="3" />
        <ellipse cx="24" cy="21" rx="4" ry="3" />
      </>
    ),
    bolt: <path d="m20 2-15 18h10l-3 12L28 13H17z" />,
    gift: (
      <>
        <path d="M4 13h26v6H4zM7 19v13h20V19M17 13v19" />
        <path d="M17 13C5 15 4 4 10 5c5 0 7 8 7 8s1-10 7-9c7 2 3 11-7 9Z" />
      </>
    ),
    lock: (
      <>
        <rect x="6" y="15" width="23" height="18" rx="2" />
        <path d="M11 15V9c0-10 13-10 13 0v6m-7 7v5" />
        <circle cx="17.5" cy="22" r="1" />
      </>
    ),
    heart: (
      <>
        <path d="M17 31 4 17C-5 6 10-1 17 9c8-10 22-3 13 8Z" />
        <path d="m18 6-5 9 7 3-5 7 3 5" />
      </>
    ),
    glass: (
      <>
        <path d="M11 3h15l-2 13c-2 9-16 7-15-1ZM8 11l16 3M15 22l-2 10m-6 0h14" />
      </>
    ),
    crown: (
      <>
        <path d="m4 12 7 8 7-15 7 15 7-9-4 19H8ZM8 34h20" />
        <circle cx="4" cy="10" r="2" />
        <circle cx="18" cy="3" r="2" />
        <circle cx="32" cy="9" r="2" />
      </>
    ),
    fire: (
      <path d="M18 2c4 10-4 10 2 16 3-1 4-4 5-7 13 17 0 25-8 25C4 36-2 25 9 13c-2 8 1 9 3 10 1-7 7-11 6-21Z" />
    ),
    mask: (
      <>
        <path d="M5 7 18 2l13 5v14c-1 10-13 15-13 15S6 31 5 21Z" />
        <path d="M10 13h5m6 0h5m-14 12c4-3 8-3 12 0" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 36 38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.music}
    </svg>
  );
}
// Exact approved supporting photography, framed from the supplied mockup.
// All headings/copy/controls remain real HTML; no rasterized page UI.
function ReferencePhoto({
  crop,
  className = "",
}: {
  crop: [number, number, number, number];
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox={crop.join(" ")}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <image href="/images/mockup-reference.png" width="1536" height="1024" />
    </svg>
  );
}
const loveCards = [
  {
    title: "Amor",
    description: "Para decir lo que sientes",
    occasion: "Aniversario",
    crop: [74, 588, 156, 105] as [number, number, number, number],
  },
  {
    title: "Boda / Vals",
    description: "El día más especial",
    occasion: "Boda",
    crop: [238, 588, 156, 105] as [number, number, number, number],
  },
  {
    title: "Celebración",
    description: "Cumpleaños, aniversarios, logros y momentos especiales",
    occasion: "Cumpleaños",
    crop: [401, 588, 156, 105] as [number, number, number, number],
  },
  {
    title: "Agradecimiento",
    description: "Para alguien que ha hecho la diferencia",
    occasion: "Mamá o papá",
    crop: [565, 588, 156, 105] as [number, number, number, number],
  },
];
const heartbreakCards = [
  { title: "Ex tóxico", description: "Para cerrar ciclos", icon: "heart" },
  {
    title: "Me mintió",
    description: "Para decir lo que nunca dijiste",
    icon: "glass",
  },
  {
    title: "Ahora estoy mejor",
    description: "Porque el glow up también se canta",
    icon: "crown",
  },
  {
    title: "Modo rencor",
    description: "Para desahogarte sin filtro",
    icon: "fire",
  },
];
const steps = [
  ["Cuéntanos la historia", "Completa un breve formulario."],
  ["Personalizamos", "Tú eliges el estilo, género y mood."],
  ["Generamos tu canción", "Con IA, en minutos."],
  ["Escúchala y descárgala", "Compártela, regálala o llévala contigo."],
];
export function BrandLanding({ initialBrand }: { initialBrand: Brand }) {
  const [brand, setBrand] = useState(initialBrand);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const heartbreak = brand === "heartbreak";
  useEffect(() => {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "visit", brand }),
    }).catch(() => {});
  }, [brand]);
  function switchBrand() {
    const next = heartbreak ? "love" : "heartbreak";
    setBrand(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    setMenuOpen(false);
    window.history.replaceState(null, "", next === "love" ? "/" : "/rgas");
    document.title =
      (next === "love" ? "Cantalove" : "Cantalovergas") +
      " | Tu historia hecha canción";
  }
  function open(type?: string) {
    setMenuOpen(false);
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "form_start", brand }),
    }).catch(() => {});
    returnFocus.current = document.activeElement as HTMLElement;
    setOccasion(type || (heartbreak ? "Despecho" : "Aniversario"));
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
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOccasion(null);
        returnFocus.current?.focus();
      }
      if (event.key !== "Tab") return;
      const nodes = dialog.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", handle);
    };
  }, [occasion]);
  return (
    <div className={`brand-shell campaign ${heartbreak ? "heartbreak" : ""}`}>
      <header className="campaign-nav campaign-width">
        <Link
          href={heartbreak ? "/rgas" : "/"}
          className={`campaign-logo ${heartbreak ? "campaign-logo-rgas" : ""}`}
          aria-label={
            heartbreak ? "Inicio de Cantalovergas" : "Inicio de Cantalove"
          }
        >
          canta<span>{heartbreak ? "lovergas" : "love"}</span>
        </Link>
        <div className="campaign-nav-actions">
          <button className="campaign-button" onClick={() => open()}>
            Crear canción <Arrow />
          </button>
          <button
            className="campaign-menu-button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="campaign-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {menuOpen && (
          <nav
            className="campaign-menu"
            id="campaign-menu"
            aria-label="Navegación principal"
          >
            <a href="#ocasiones" onClick={() => setMenuOpen(false)}>
              Encuentra tu historia
            </a>
            <a href="#como" onClick={() => setMenuOpen(false)}>
              Cómo funciona
            </a>
            <a href="#precios" onClick={() => setMenuOpen(false)}>
              Paquetes
            </a>
            <Link href="/recuperar">Recuperar mi canción</Link>
            <button onClick={switchBrand}>
              {heartbreak ? "Ir a Cantalove" : "Ir a Cantalovergas"} <Arrow />
            </button>
          </nav>
        )}
      </header>
      <main>
        <section
          className="campaign-hero"
          id="inicio"
          aria-labelledby="campaign-title"
        >
          <div className="campaign-photo">
            <Image
              src={
                heartbreak
                  ? "/images/cantalovergas-hero.webp"
                  : "/images/cantalove-hero.webp"
              }
              alt={
                heartbreak
                  ? "Una mujer y un hombre expresando su despecho con actitud, bajo un cielo azul"
                  : "Una pareja abrazada junto al mar al atardecer"
              }
              fill
              sizes="(max-width: 700px) 100vw, 75vw"
              preload
              unoptimized
            />
          </div>
          <div className="campaign-width campaign-hero-content">
            <h1 id="campaign-title">
              {heartbreak ? (
                <>
                  <span>Despecho</span>
                  <span>también suena</span>
                  <em>bonito ♡</em>
                </>
              ) : (
                <>
                  <span>La canción</span>
                  <span>que llevas años</span>
                  <span>queriendo</span>
                  <em>regalarle</em>
                </>
              )}
            </h1>
            <p className="campaign-hero-description">
              {heartbreak ? (
                <>
                  Convierte la historia que te rompió el corazón en una canción
                  única, con la mejor dosis de honestidad, humor y poder. Sin
                  filtros.
                  <br />
                  Sin coros ajenos. Sólo tu verdad, en música.
                </>
              ) : (
                <>
                  Cuéntanos su historia y la convertimos
                  <br className="desktop-copy-break" /> en una canción única,
                  creada con IA.
                  <br />
                  Un regalo que emociona hoy y
                  <br className="desktop-copy-break" /> permanece en la memoria.
                </>
              )}
            </p>
            <button
              className="campaign-button campaign-hero-cta"
              onClick={() => open()}
            >
              Crear mi canción <Arrow />
            </button>
          </div>
          {heartbreak && (
            <p className="campaign-hand-note">
              Porque
              <br />
              también se
              <br />
              canta lo que
              <br />
              duele ♡
            </p>
          )}
        </section>
        <div className="campaign-proof">
          <div className="campaign-width campaign-proof-grid">
            {(heartbreak
              ? [
                  ["bolt", "Lista en minutos", "(o para superar)"],
                  ["glass", "Perfecta para", "desahogarte"],
                  ["mask", "Escucha completa", "antes de pagar"],
                  ["fire", "Tu historia,", "tu canción"],
                ]
              : [
                  ["music", "Una canción", "original"],
                  ["bolt", "Lista en", "minutos"],
                  ["gift", "Perfecta", "para regalar"],
                  ["lock", "Tu historia", "es privada"],
                ]
            ).map(([icon, one, two]) => (
              <div key={icon}>
                <Icon name={icon} />
                <p>
                  {one}
                  <br />
                  {two}
                </p>
              </div>
            ))}
          </div>
        </div>
        <section className="campaign-occasions" id="ocasiones">
          <div className="campaign-width">
            <h2>
              {heartbreak ? (
                "¿Qué tipo de despecho vas a cantar?"
              ) : (
                <>
                  ¿Qué momento quieres convertir
                  <br /> en canción?
                </>
              )}
            </h2>
            <div className="campaign-card-grid">
              {heartbreak
                ? heartbreakCards.map((card) => (
                    <button
                      className="campaign-note-card"
                      key={card.title}
                      onClick={() => open("Despecho")}
                    >
                      <Icon name={card.icon} />
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      <Arrow circle />
                    </button>
                  ))
                : loveCards.map((card) => (
                    <button
                      className="campaign-photo-card"
                      key={card.title}
                      onClick={() => open(card.occasion)}
                    >
                      <ReferencePhoto crop={card.crop} />
                      <div className="campaign-photo-card-copy">
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                      </div>
                      <Arrow circle />
                    </button>
                  ))}
            </div>
          </div>
        </section>
        <section className="campaign-how" id="como">
          <div className="campaign-width">
            <h2>Así de fácil</h2>
            <ol>
              {steps.map(([title, text], index) => (
                <li key={title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="campaign-story">
          <div className="campaign-width campaign-story-grid">
            {heartbreak ? (
              <div className="campaign-headphones">
                <ReferencePhoto crop={[796, 823, 334, 201]} />
              </div>
            ) : (
              <div
                className="campaign-gift-art"
                aria-label="Una portada de nuestra canción junto a un disco de vinilo"
              >
                <div className="campaign-small-record">
                  <span />
                </div>
                <div className="campaign-polaroid">
                  <span>
                    Nuestra
                    <br />
                    canción ♡
                  </span>
                  <ReferencePhoto crop={[74, 588, 156, 105]} />
                </div>
              </div>
            )}
            <div className="campaign-story-copy">
              <h2>
                {heartbreak ? (
                  <>
                    Lo que duele,
                    <br />
                    también se canta
                  </>
                ) : (
                  <>
                    Un regalo que
                    <br />
                    siempre se queda
                  </>
                )}
              </h2>
              <p>
                {heartbreak ? (
                  <>
                    Una canción para sanar, reír, soltar o viralizar.
                    <br />
                    El despecho también merece un buen soundtrack.
                  </>
                ) : (
                  <>
                    Más que una canción, es un recuerdo para siempre. Perfecto
                    para celebrar, sorprender o simplemente decirlo con música.
                  </>
                )}
              </p>
              <button className="campaign-button" onClick={() => open()}>
                Crear mi canción <Arrow />
              </button>
            </div>
          </div>
        </section>
        <section className="campaign-pricing" id="precios">
          <div className="campaign-width">
            <p className="campaign-kicker">ESCUCHA PRIMERO. DECIDE DESPUÉS.</p>
            <h2>Tu historia, a tu manera.</h2>
            <p className="campaign-pricing-intro">
              Una generación gratuita por correo verificado. Escucha las dos
              versiones completas antes de elegir.
            </p>
            <div className="campaign-package-grid">
              {[
                {
                  name: "Básico",
                  price: 249,
                  description: "Una pieza instrumental personalizada.",
                  features: ["1 versión instrumental", "Archivo MP3"],
                  active: false,
                },
                {
                  name: "Premium",
                  price: 449,
                  description: "Tu historia convertida en letra y música.",
                  features: ["2 versiones de tu canción", "MP3 + letra en PDF"],
                  active: true,
                },
                {
                  name: "VIP",
                  price: 899,
                  description: "Para grandes momentos.",
                  features: [
                    "Paquete en preparación",
                    "Prestaciones por confirmar",
                  ],
                  active: false,
                },
              ].map((tier) => (
                <article
                  key={tier.name}
                  className={
                    tier.active
                      ? "campaign-package featured"
                      : "campaign-package"
                  }
                >
                  <span>{tier.active ? "TU HISTORIA HECHA MÚSICA" : ""}</span>
                  <h3>{tier.name}</h3>
                  <p className="campaign-price">
                    ${tier.price}
                    <small> MXN</small>
                  </p>
                  <p>{tier.description}</p>
                  <ul>
                    {tier.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button
                    className="campaign-button"
                    disabled={!tier.active}
                    onClick={() => open()}
                  >
                    {tier.active ? "Escuchar mi canción" : "Próximamente"}
                    {tier.active && <Arrow />}
                  </button>
                </article>
              ))}
            </div>
            <p className="campaign-package-note">
              La duración elegida es aproximada. Básico y VIP permanecen sin
              venta hasta validar sus prestaciones.
            </p>
          </div>
        </section>
        <div className="campaign-brand-switch campaign-width">
          <p>
            {heartbreak
              ? "¿Hoy tu historia es de amor?"
              : "¿Tu historia tiene otro final?"}
          </p>
          <button onClick={switchBrand}>
            {heartbreak ? "Ir a Cantalove" : "Ir a Cantalovergas"} <Arrow />
          </button>
        </div>
      </main>
      <Footer brand={brand} />
      {occasion !== null && (
        <div
          className="overlay open"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
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
