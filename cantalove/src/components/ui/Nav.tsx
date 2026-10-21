import Link from "next/link";
import { Logo } from "./Logo";

export function Nav() {
  return (
    <header className="absolute top-0 inset-x-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <Logo />
        <Link
          href="/crear"
          className="rounded-full border border-white/20 hover:border-white/40 transition-colors px-5 py-2 text-sm font-medium text-text"
        >
          Crear canción
        </Link>
      </div>
    </header>
  );
}
