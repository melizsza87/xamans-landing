import Link from "next/link";
const BAR_HEIGHTS = [20,45,30,60,40,70,35,55,25,65,45,30,50,75,40,60,30,45,55,35,65,40,25,50,70,45,30,60,40,55];
export function SamplePlayer() {
  return <div className="rounded-2xl border border-white/10 bg-surface/60 p-6 sm:p-8">
    <p className="text-xs uppercase tracking-[.25em] text-accent-soft">Tu historia merece una canción</p>
    <div className="mt-8 flex h-24 items-center gap-1">
      {BAR_HEIGHTS.map((h,i) => <span key={i} className="flex-1 rounded-full bg-accent/70" style={{ height: h + "%" }}/>)}
    </div>
    <p className="mt-8 font-display text-2xl text-text">Tu historia. Tu voz. Tu canción.</p>
    <p className="mt-3 text-sm text-text-muted">Pronto podrás escuchar aquí canciones de ejemplo. No mostramos una reproducción simulada.</p>
    <Link href="/crear" className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">Crear mi canción</Link>
  </div>;
}