import Link from "next/link";
export function Footer({ brand = "love" }: { brand?: string }) {
  return (
    <footer className="wrap footer">
      <Link className="logo" href="/">
        canta<b>{brand === "heartbreak" ? "lovergas" : "love"}</b> ♡
      </Link>
      <span>© 2026 Cantalove · Hecho para historias reales.</span>
      <span className="legal-links">
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/terminos">Términos</Link>
        <a href="#inicio">Volver arriba ↑</a>
      </span>
    </footer>
  );
}
