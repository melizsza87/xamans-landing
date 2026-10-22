import Link from "next/link";

export function Nav({ brand = "love" }: { brand?: string }) {
  return (
    <header className="wrap nav">
      <Link href="/" className="logo" aria-label="Inicio de Cantalove">
        canta<b>{brand === "heartbreak" ? "lovergas" : "love"}</b>
        <span aria-hidden="true"> ♡</span>
      </Link>
      <nav aria-label="Navegación principal">
        <Link href="/#como">Cómo funciona</Link>
        <Link href="/#ocasiones">Ocasiones</Link>
        <Link href="/#precios">Paquetes</Link>
      </nav>
      <div className="nav-right">
        <Link
          href={brand === "heartbreak" ? "/" : "/rgas"}
          className="nav-switch"
        >
          {brand === "heartbreak" ? "¿Te enamoraste? ↗" : "¿Corazón roto? ↗"}
        </Link>
        <Link
          className="solid"
          href={brand === "heartbreak" ? "/crear?brand=heartbreak" : "/crear"}
        >
          Crear canción ↗
        </Link>
      </div>
    </header>
  );
}
