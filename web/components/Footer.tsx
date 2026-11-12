import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0b121a]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><span className="font-black tracking-wide text-slate-300">CABEZONES</span><span className="ml-2">Minijuegos para retar a tus amigos.</span></div>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="transition-colors hover:text-slate-200">Privacidad</Link>
          <Link href="/terms" className="transition-colors hover:text-slate-200">Términos</Link>
        </nav>
        <p>Esta demo no acepta apuestas ni transfiere SOL.</p>
      </div>
    </footer>
  );
}
