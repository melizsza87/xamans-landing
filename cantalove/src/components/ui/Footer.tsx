export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
        <p className="font-display text-text">
          canta<span className="text-accent">love</span>
        </p>
        <p>&copy; {new Date().getFullYear()} cantalove. Hecho con IA y mucho cariño.</p>
      </div>
    </footer>
  );
}
