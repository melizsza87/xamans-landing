import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="font-display text-2xl tracking-wide text-text hover:text-accent-soft transition-colors"
    >
      canta<span className="text-accent">love</span>
    </Link>
  );
}
