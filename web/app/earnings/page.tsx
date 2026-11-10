"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, CircleDollarSign, Clock3, KeyRound, PackageOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useWalletEarnings, useWalletKeys } from "@/lib/walletKeys";

export default function EarningsPage() {
  const { address } = useAccount();
  const earnings = useWalletEarnings(address);
  const keyInventory = useWalletKeys(address);

  return (
    <main className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden bg-[#050807] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(163,230,53,0.13),transparent_42%),radial-gradient(ellipse_at_100%_80%,rgba(234,179,8,0.08),transparent_34%)]" />
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-300/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to coins
        </Link>

        <header className="mt-8 rounded-[28px] border border-lime-200/15 bg-[#080d09]/85 p-6 shadow-[0_25px_80px_-50px_rgba(163,230,53,0.55)] sm:mt-10 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/[0.06] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" /> Live wallet inventory
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">Earnings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
                Cada caja que abras con una llave aparecerá aquí, asociada a la wallet con la que jugaste.
              </p>
            </div>

            {address && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/[0.06] px-3 py-2 font-mono text-xs text-amber-100">
                  <KeyRound className="h-4 w-4" /> {keyInventory.keys} llaves
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-neutral-300">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </header>

        {!address ? (
          <section className="mt-6 rounded-[28px] border border-amber-200/15 bg-black/35 p-7 text-center sm:mt-8 sm:p-10">
            <CircleDollarSign className="mx-auto h-12 w-12 text-amber-100" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-white">Conecta tu wallet para ver tus premios</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-400">El inventario se consulta para la dirección conectada. Usa la misma wallet con la que abriste las cajas.</p>
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <button
                  type="button"
                  onClick={openConnectModal}
                  disabled={!mounted}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-lime-100/50 bg-lime-300 px-6 py-3 text-sm font-black uppercase tracking-wide text-[#10170b] shadow-[0_8px_32px_-12px_rgba(163,230,53,0.7)] transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" /> {mounted ? "Connect wallet" : "Loading wallets…"}
                </button>
              )}
            </ConnectButton.Custom>
          </section>
        ) : (
          <section className="mt-6 sm:mt-8" aria-labelledby="earned-prizes-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="earned-prizes-heading" className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">Premios obtenidos</h2>
                <p className="mt-1 text-xs text-neutral-500">{earnings.length} {earnings.length === 1 ? "caja abierta" : "cajas abiertas"}</p>
              </div>
              <span className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-lime-200/80 sm:text-[10px]">
                <Sparkles className="h-3.5 w-3.5" /> Se actualiza al abrir una caja
              </span>
            </div>

            {earnings.length ? (
              <div className="space-y-3">
                {earnings.map((earning) => (
                  <article key={earning.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b100c]/90 p-4 shadow-[0_12px_32px_-24px_rgba(0,0,0,0.9)] sm:flex-row sm:items-center sm:p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-lime-200/20 bg-lime-200/[0.07] text-lime-100">
                      <PackageOpen className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white">{earning.title}</h3>
                        <span className="rounded-full border border-lime-200/15 bg-lime-200/[0.05] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-lime-100/75">Caja {earning.boxId}</span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-400">{earning.detail}</p>
                    </div>
                    <time dateTime={new Date(earning.openedAt).toISOString()} className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                      <Clock3 className="h-3.5 w-3.5" /> {new Date(earning.openedAt).toLocaleString("es-ES")}
                    </time>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-white/10 bg-black/35 px-6 py-12 text-center">
                <PackageOpen className="mx-auto h-11 w-11 text-neutral-600" aria-hidden />
                <h3 className="mt-4 text-lg font-bold text-white">Todavía no has abierto ninguna caja</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">Reclama tus llaves en la cabecera y vuelve a Coins para elegir una caja.</p>
                <Link href="/#coins" className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-lime-200/25 bg-lime-200/[0.07] px-5 py-2.5 text-sm font-semibold text-lime-100 transition hover:bg-lime-200/15">
                  Ir a las cajas
                </Link>
              </div>
            )}
          </section>
        )}

        <p className="mt-8 text-center text-[10px] leading-5 text-neutral-600">
          El inventario y estos registros son una demostración local asociada a esta wallet en este navegador. No se transfieren tokens, SOL ni comisiones reales.
        </p>
      </div>
    </main>
  );
}
