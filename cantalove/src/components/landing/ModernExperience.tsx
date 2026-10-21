import Link from "next/link";
import type { CSSProperties } from "react";

type Tile = { label: string; description: string; image: string; href: string };
const loveTiles: Tile[] = [
  {label:"Amor", description:"Para decir lo que sientes", image:"https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=82",href:"/crear?occasion=Aniversario"},
  {label:"Celebración",description:"Cumpleaños y momentos especiales",image:"https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=82",href:"/crear?occasion=Cumpleaños"},
  {label:"Agradecimiento",description:"Para quien siempre estuvo",image:"https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=82",href:"/crear?occasion=Día%20de%20las%20Madres"},
  {label:"Boda / Vals",description:"Para novios, mamá o papá",image:"https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=82",href:"/vals"},
];
const heartbreakTiles = [
  {icon:"♡",name:"Ex tóxico",description:"Para cerrar ciclos y soltar de una vez"},
  {icon:"♧",name:"Me mintió",description:"Para decir lo que nunca dijiste"},
  {icon:"♛",name:"Ahora estoy mejor",description:"Porque el glow up también se canta"},
  {icon:"♨",name:"Modo rencor",description:"Para desahogarte sin filtro"},
];
const stages = [
  ["01","Cuéntanos tu historia","Completa un formulario con los detalles."],
  ["02","Personaliza la canción","Elige estilo, género y voz."],
  ["03","Generamos tu canción","La IA convierte la historia en música."],
  ["04","Escucha y decide","Si te encanta, paga para descargarla."],
];
const tiers = [
  {name:"Básico",amount:"$249",features:["Una canción personalizada","Escucha antes de comprar","Descarga MP3 tras el pago"]},
  {name:"Premium",amount:"$449",features:["Dos versiones cuando estén disponibles","Descarga de ambas versiones","Letra en PDF"]},
];
const bg = (url: string): CSSProperties => ({backgroundImage:'url("'+url+'")'});
const heroLove = "https://images.pexels.com/photos/8575560/pexels-photo-8575560.jpeg?auto=compress&cs=tinysrgb&w=1800";
const heroWoman = "https://images.pexels.com/photos/29400911/pexels-photo-29400911.jpeg?auto=compress&cs=tinysrgb&w=1800";
const heroTequila = "https://images.pexels.com/photos/7269234/pexels-photo-7269234.jpeg?auto=compress&cs=tinysrgb&w=850";

export function ModernExperience({mode}:{mode:"love"|"breakup"}) {
  const heartbreak = mode === "breakup";
  const createHref = heartbreak ? "/crear/despecho" : "/crear";
  const ownHome = heartbreak ? "/rgas" : "/";
  const otherHome = heartbreak ? "/" : "/rgas";
  return <div className={heartbreak ? "rev-site rev-breakup":"rev-site rev-love"}>
    <header className="rev-header">
      <Link href={ownHome} className="rev-logo" aria-label={heartbreak?"Inicio Cantalovergas":"Inicio Cantalove"}>
        canta<span>{heartbreak?"loverga":"love"}</span>{heartbreak
          ? <svg className="rev-logo-mark rev-logo-tail" viewBox="0 0 42 58" aria-hidden="true"><path d="M3 6 C30 12 35 27 25 39 C19 47 13 43 16 36 M25 39 L40 34 L35 49 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M35 33 L41 50 L26 42 Z" fill="currentColor"/></svg>
          : <svg className="rev-logo-mark rev-logo-heart" viewBox="0 0 46 48" aria-hidden="true"><path d="M23 43 C13 32 3 25 4 14 C5 1 18 1 23 13 C30 -1 44 3 42 16 C40 27 29 36 23 43 Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </Link>
      <nav className="rev-nav" aria-label="Navegación principal">
        <a href="#momentos">{heartbreak?"Historias":"Ocasiones"}</a>
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#precios">Precios</a>
        <a href="#anonimo">Envío anónimo</a>
      </nav>
      <Link href={createHref} className="rev-top-cta">Crear canción <span aria-hidden>↗</span></Link>
    </header>
    <main>
      {heartbreak ?
        <section className="rev-hero rev-hero-breakup">
          <picture className="rev-hero-visual rev-hero-picture">
            <source media="(max-width: 700px)" srcSet="https://images.pexels.com/photos/29400911/pexels-photo-29400911.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=1100" />
            <img src={heroWoman} alt="Mujer con lentes oscuros y expresión atrevida" width={1200} height={1600} loading="eager" fetchPriority="high" />
          </picture>
          <div className="rev-hero-left">
            <h1>Despecho<br/>también suena<br/><em>bonito</em> <span className="rev-heart">♡</span></h1>
            <p>Convierte la historia que te rompió el corazón en una canción única. Con toda la honestidad, humor y poder que merece tu historia.</p>
            <Link className="rev-button" href={createHref}>Crear mi canción <span aria-hidden>→</span></Link>
            <div className="rev-proof"><span>♬ Hecha a tu medida</span><span>✦ Escúchala primero</span><span>♡ Envío anónimo</span></div>
          </div>
          
        </section>
      :
        <section className="rev-hero rev-hero-love">
          <picture className="rev-hero-visual rev-hero-picture">
            <source media="(max-width: 700px)" srcSet="https://images.pexels.com/photos/8575560/pexels-photo-8575560.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=1100" />
            <img src={heroLove} alt="Pareja feliz: él la besa en la mejilla mientras ella sonríe" width={1500} height={1000} loading="eager" fetchPriority="high" />
          </picture>
          <div className="rev-hero-left">
            <h1>La canción<br/>que llevas años<br/>queriendo <em>regalarle</em></h1>
            <p>Cuéntanos su historia y la convertimos en una canción única, creada con IA. Un regalo que emociona hoy y permanece en la memoria.</p>
            <Link className="rev-button" href={createHref}>Crear mi canción <span aria-hidden>→</span></Link>
            <div className="rev-proof"><span>♫ Personalizada</span><span>♡ Escúchala primero</span><span>🎁 Para regalar</span></div>
          </div>
          
        </section>
      }

      <section id="momentos" className="rev-moments">
        <h2>{heartbreak?"¿Qué tipo de despecho vas a cantar?":"¿Qué momento quieres convertir en canción?"}</h2>
        {heartbreak ?
          <div className="rev-notes">
            {heartbreakTiles.map((tile,i)=><Link href={createHref} className={"rev-note rev-note-"+i} key={tile.name}>
              <span className="rev-note-icon" aria-hidden>{tile.icon}</span>
              <strong>{tile.name}</strong><small>{tile.description}</small><span className="rev-note-go">↗</span>
            </Link>)}
          </div>
        :
          <div className="rev-tiles">
            {loveTiles.map(tile=><Link href={tile.href} key={tile.label} className="rev-tile" style={bg(tile.image)}>
              <span className="rev-tile-content"><strong>{tile.label}</strong><small>{tile.description}</small></span>
              <span className="rev-tile-go" aria-hidden>›</span>
            </Link>)}
          </div>
        }
      </section>

      <section id="como-funciona" className="rev-process">
        <h2>Así de fácil</h2>
        <div className="rev-process-items">{stages.map(([id,head,desc])=><div className="rev-process-item" key={id}>
          <span className="rev-process-circle">{Number(id)}</span>
          <div><h3>{head}</h3><p>{desc}</p></div>
        </div>)}</div>
      </section>

      {heartbreak ?
        <section className="rev-feature rev-feature-breakup">
          <div className="rev-feature-photos">
            <div className="rev-feature-photo" style={bg("https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=850&q=85")} role="img" aria-label="Persona disfrutando música con audífonos"/>
            <div className="rev-feature-photo rev-tequila" style={bg(heroTequila)} role="img" aria-label="Hombre tomando una copa en un bar, inspiración para la categoría tequila y despecho"/>
          </div>
          <div className="rev-feature-copy">
            <h2>Lo que duele,<br/>también se canta</h2>
            <p>Una canción para reír, soltar o desahogarte. Tu despecho también merece un buen soundtrack.</p>
            <Link className="rev-button" href={createHref}>Crear mi canción →</Link>
          </div>
        </section>
      :
        <section className="rev-feature rev-feature-love">
          <div className="rev-feature-memory">
            <div className="rev-record" aria-hidden><i/></div>
            <div className="rev-polaroid" style={bg("https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=650&q=80")}>
              <span>Nuestra canción ♡</span>
            </div>
          </div>
          <div className="rev-feature-copy">
            <h2>Un regalo que<br/>siempre se queda</h2>
            <p>Más que una canción, un recuerdo para siempre. Perfecto para dedicar, sorprender o simplemente decirlo como nunca antes.</p>
            <Link className="rev-button" href={createHref}>Crear mi canción →</Link>
          </div>
        </section>
      }

      <section className="rev-share" id="anonimo">
        <span className="rev-kicker">UN DETALLE SORPRESA</span>
        <h2>También puedes enviarla <em>anónimamente.</em></h2>
        <p>Después de comprar, comparte un enlace privado que no muestra quién envió la canción. Tú decides a quién mandarlo, sin correos automáticos a terceros. La letra puede contener pistas sobre tu identidad.</p>
        <Link href={createHref} className="rev-outline">Preparar mi canción →</Link>
      </section>

      <section id="precios" className="rev-pricing">
        <span className="rev-kicker">SIN SUSCRIPCIÓN</span>
        <h2>Escúchala primero. Si te encanta, es tuya.</h2>
        <div className="rev-price-grid">{tiers.map((tier,i)=><div className={"rev-plan "+(i===1?"rev-plan-highlight":"")} key={tier.name}>
          <span>{tier.name}</span><strong>{tier.amount}<small> MXN</small></strong>
          <ul>{tier.features.map(f=><li key={f}>✓ {f}</li>)}</ul>
          <Link href={createHref} className="rev-button">Crear mi canción →</Link>
        </div>)}</div>
        <p className="rev-price-disclosure">Premium solo se ofrece si hay dos versiones musicales disponibles. La generación y los pagos requieren activar las integraciones antes de vender.</p>
      </section>
      <section className="rev-last">
        <h2>{heartbreak?"Que tu próxima canción sea para ti.":"Hay historias que merecen sonar para siempre."}</h2>
        <Link className="rev-button" href={createHref}>Crear mi canción →</Link>
      </section>
    </main>
    <footer className="rev-footer">
      <Link href={ownHome} className="rev-logo">canta<span>{heartbreak?"lovergas":"love"}</span></Link>
      <p>© {new Date().getFullYear()} Cantalove. Música personalizada con IA.</p>
      <Link href={otherHome}>{heartbreak?"Volver al amor ♡":"¿En modo despecho? ↗"}</Link>
    </footer>
  </div>;
}
