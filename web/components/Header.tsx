"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CircleDollarSign, Dices, KeyRound, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { getAddress } from "viem";
import { useAccount, useDisconnect } from "wagmi";
import { useSearch } from "./SearchContext";
import { useWalletKeys } from "@/lib/walletKeys";

export function Header() {
  const pathname = usePathname();
  const { setQuery } = useSearch();
  const { address: connected } = useAccount();
  const keyInventory = useWalletKeys(connected);
  const { disconnect } = useDisconnect();
  // EVERY connected wallet has a profile now (auto-named until claimed, editable
  // there), so this no longer waits on the launch feed or requires having planted
  // a coin — that older gate left non-planters with no way to reach their profile.
  const myProfileHref = useMemo(() => {
    if (!connected) return null;
    try {
      return `/creator/${getAddress(connected)}`;
    } catch {
      return null;
    }
  }, [connected]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-900/65 shadow-[0_8px_30px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[76px] w-full max-w-6xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" onClick={() => setQuery("")} className="flex min-w-0 shrink-0 items-center">
          <Image
            src="/header-logo.png"
            alt="Site logo"
            width={64}
            height={64}
            sizes="(min-width: 640px) 64px, 56px"
            priority
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
        </Link>

        <nav className="hidden rounded-full bg-[linear-gradient(115deg,rgba(163,230,53,0.28),rgba(255,255,255,0.1)_42%,rgba(34,197,94,0.34))] p-px shadow-[0_12px_32px_-20px_rgba(34,197,94,0.4)] md:block">
          <div className="flex items-center gap-1 rounded-full bg-[#07100a]/95 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(34,197,94,0.06)] backdrop-blur-2xl backdrop-saturate-150">
            <Link
              href="/"
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                pathname === "/"
                  ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(34,197,94,0.13))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_5px_18px_-11px_rgba(34,197,94,0.7)] ring-1 ring-lime-400/15"
                  : "text-neutral-100/90 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              Explore
            </Link>
            <a
              href="/roulette"
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                pathname.startsWith("/roulette")
                  ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(34,197,94,0.13))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_5px_18px_-11px_rgba(34,197,94,0.7)] ring-1 ring-lime-400/15"
                  : "text-neutral-100/90 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              <span className="inline-flex items-center gap-2"><Dices className="h-4 w-4" /> Roulette</span>
            </a>

            <Link
              href="/rules"
              className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                pathname.startsWith("/rules")
                  ? "bg-lime-400/10 text-white ring-1 ring-lime-400/15"
                  : "text-neutral-100/90 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              Normativa
            </Link>

            <Link
              href="/earnings"
              className={`relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                pathname.startsWith("/earnings")
                  ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(34,197,94,0.13))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_5px_18px_-11px_rgba(34,197,94,0.7)] ring-1 ring-lime-400/15"
                  : "text-neutral-100/90 hover:bg-white/[0.055] hover:text-white"
              }`}
            >
              <CircleDollarSign className="h-4 w-4" /> Earnings
            </Link>

            <button
              type="button"
              disabled
              className="group flex cursor-not-allowed items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#c5b593]/85"
            >
              Marketplace
              <span className="rounded-full border border-lime-300/25 bg-lime-500/10 px-2 py-0.5 text-[9px] font-bold uppercase leading-none text-lime-200/80">
                Soon
              </span>
            </button>
            <button
              type="button"
              disabled
              className="group flex cursor-not-allowed items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#c5b593]/85"
            >
              Subscriptions
              <span className="rounded-full border border-lime-300/25 bg-lime-500/10 px-2 py-0.5 text-[9px] font-bold uppercase leading-none text-lime-200/80">
                Soon
              </span>
            </button>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/roulette"
            aria-label="Roulette"
            title="Roulette"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-lime-300/20 bg-lime-300/10 text-lime-100 transition hover:bg-lime-300/20 md:hidden sm:h-auto sm:w-auto sm:px-3 sm:py-2"
          >
            <Dices className="h-4 w-4" />
            <span className="hidden sm:ml-2 sm:inline">Roulette</span>
          </Link>
          <Link
            href="/create"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-lime-300 px-2.5 py-2 text-xs font-semibold text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_-8px_rgba(34,197,94,0.9)] transition-all hover:bg-lime-200 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[15px] ${
              pathname === "/create" ? "ring-2 ring-amber-300/50" : ""
            }`}
          >
            <span className="text-lg leading-none">+</span> <span>Create</span>
          </Link>
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;
              return !connected ? (
                <div className="flex items-center">
                  <button type="button" onClick={openConnectModal} disabled={!ready} className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-full border border-amber-200/35 bg-[linear-gradient(110deg,rgba(245,158,11,0.22),rgba(234,179,8,0.1))] px-5 py-2.5 text-sm font-bold text-amber-100 shadow-[0_0_24px_-12px_rgba(251,191,36,0.65)] transition hover:border-amber-100/50 hover:bg-amber-200/20 disabled:opacity-50">
                    <KeyRound className="h-4 w-4" /> Get keys
                  </button>
                </div>
              ) : chain.unsupported ? (
                <div className="flex items-center gap-2">
                  {!keyInventory.claimed && <button type="button" onClick={keyInventory.claim} className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-xs font-semibold text-amber-100">Get 1–4 keys</button>}
                  <span title="Wallet keys" className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-2 font-mono text-xs font-bold text-amber-100"><KeyRound className="h-4 w-4" /> {keyInventory.keys}</span>
                  <button type="button" onClick={openChainModal} className="rounded-full bg-red-950/60 px-4 py-2 text-sm font-medium text-red-400">Wrong network</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {!keyInventory.claimed && <button type="button" onClick={keyInventory.claim} className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/15">Get 1–4 keys</button>}
                  <span title="Wallet keys" className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-2 font-mono text-xs font-bold text-amber-100"><KeyRound className="h-4 w-4" /> {keyInventory.keys}</span>
                  {myProfileHref && <Link href={myProfileHref} aria-label="My profile" className="hidden items-center justify-center rounded-full px-2 py-2 text-neutral-300 hover:bg-white/10 sm:flex"><User className="h-6 w-6" /></Link>}
                          <button type="button" onClick={() => disconnect()} aria-label="Disconnect" className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-red-400"><LogOut className="h-4 w-4" /></button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
