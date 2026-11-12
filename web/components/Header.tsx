"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Wallet } from "lucide-react";

type SolanaProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect?: () => Promise<void>;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
  }
}

export function Header() {
  const pathname = usePathname();
  const [wallet, setWallet] = useState("");
  const [notice, setNotice] = useState("");

  async function toggleWallet() {
    const provider = window.phantom?.solana ?? window.solana;
    if (wallet) {
      try { await provider?.disconnect?.(); } finally { setWallet(""); setNotice(""); }
      return;
    }
    if (!provider?.connect) {
      setNotice("Instala Phantom para conectar una wallet Solana.");
      return;
    }
    try {
      const result = await provider.connect();
      setWallet(result.publicKey.toString());
      setNotice("");
    } catch {
      setNotice("No se pudo conectar la wallet.");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0b121a]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] w-full max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Cabezones, inicio">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a8f26c] text-slate-950"><Gamepad2 className="h-5 w-5" /></span>
          <span className="text-lg font-black uppercase tracking-[-0.04em] text-white sm:text-xl">CABEZ<span className="text-[#a8f26c]">ONES</span></span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link href="/#juego" className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${pathname === "/" ? "text-white" : "text-slate-400 hover:text-white"}`}>Juegos</Link>
          <Link href="/#como-jugar" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-white">Cómo jugar</Link>
          <span className="ml-2 rounded-full border border-[#a8f26c]/15 bg-[#a8f26c]/[0.07] px-2.5 py-1 text-[10px] font-black tracking-[0.15em] text-[#b9f78b]">SOLANA</span>
        </nav>

        <div className="ml-auto relative flex items-center gap-2">
          <button onClick={toggleWallet} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-white transition hover:border-[#a8f26c]/35 hover:bg-[#a8f26c]/[0.08] sm:px-4 sm:text-sm">
            <Wallet className="h-4 w-4 text-[#a8f26c]" />{wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "Conectar wallet"}
          </button>
          {notice && <div role="status" className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-xl border border-white/10 bg-[#172330] p-3 text-xs leading-5 text-slate-200 shadow-xl">{notice}</div>}
        </div>
      </div>
    </header>
  );
}
