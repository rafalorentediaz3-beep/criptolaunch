"use client";

import { ArrowLeft, Coins, Crown, Dices, RotateCw, Sparkles, Zap } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";

const REWARDS = [
  {
    id: "airdrop",
    figure: "50%",
    label: "MMG SUPPLY",
    title: "Airdrop para traders",
    description: "Distribución gratuita anunciada para traders activos de Solana.",
    icon: Crown,
    color: "text-amber-100",
  },
  {
    id: "sol",
    figure: "SOL",
    label: "RECOMPENSA AUTOMÁTICA",
    title: "SOL en tu wallet",
    description: "MMG afirmaba que sus holders recibirían recompensas en SOL.",
    icon: Coins,
    color: "text-violet-100",
  },
  {
    id: "fees",
    figure: "4%",
    label: "COMISIONES DE LIQUIDEZ",
    title: "Reparto a holders",
    description: "El anuncio proponía devolver a los holders el 4% de esas comisiones.",
    icon: Zap,
    color: "text-cyan-100",
  },
];

const LANDING_ANGLES = [0, 240, 120];

export default function RoulettePage() {
  const { address, isConnected } = useAccount();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<(typeof REWARDS)[number] | null>(null);
  const [resultWallet, setResultWallet] = useState<string | null>(null);

  function spin() {
    if (spinning || !isConnected || !address) return;
    const winnerIndex = Math.floor(Math.random() * REWARDS.length);
    setResult(null);
    setResultWallet(address);
    setSpinning(true);
    setRotation((current) => {
      const currentAngle = ((current % 360) + 360) % 360;
      const targetAngle = LANDING_ANGLES[winnerIndex];
      const adjustment = (targetAngle - currentAngle + 360) % 360;
      return current + 360 * 7 + adjustment;
    });
    window.setTimeout(() => {
      setResult(REWARDS[winnerIndex]);
      setSpinning(false);
    }, 5200);
  }

  return (
    <main className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden bg-[#050807] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_15%,rgba(163,230,53,0.13),transparent_38%),radial-gradient(ellipse_at_10%_80%,rgba(124,58,237,0.12),transparent_35%),radial-gradient(ellipse_at_90%_75%,rgba(6,182,212,0.1),transparent_35%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-[0.13] [background-image:linear-gradient(rgba(190,242,100,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(190,242,100,0.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />

      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-300/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to coins
        </Link>

        <header className="mx-auto mt-8 max-w-4xl text-center sm:mt-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/[0.07] px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-lime-200 sm:text-xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" /> MMG · the passive-reward glitch
          </div>
          <h1 className="text-balance text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            One spin. Three unexpected rewards.
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base italic leading-7 text-amber-100 sm:text-xl">
            “There is no finer form of income than the kind that simply arrives.”
          </p>
          <p className="mt-1 text-sm text-neutral-400">No existe una forma de ingreso mejor que aquella que simplemente llega.</p>
        </header>

        <section className="mx-auto mt-10 grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)] lg:gap-14">
          <div className="relative mx-auto w-full max-w-[620px]">
            <div aria-hidden className="absolute -inset-8 rounded-full bg-lime-300/[0.08] blur-3xl" />
            <div aria-hidden className="absolute left-1/2 top-[-22px] z-30 -translate-x-1/2 drop-shadow-[0_0_15px_rgba(253,224,71,0.85)]">
              <div className="h-0 w-0 border-x-[17px] border-t-[38px] border-x-transparent border-t-yellow-200" />
            </div>
            <div className="relative aspect-square w-full rounded-full border-[7px] border-lime-200/80 bg-[#070b08] p-2 shadow-[0_0_0_5px_rgba(163,230,53,0.09),0_0_75px_-18px_rgba(163,230,53,0.55)] sm:border-[10px] sm:p-3">
              <div
                role="img"
                aria-label="Ruleta de tres premios anunciados por MMG"
                className="relative h-full w-full overflow-hidden rounded-full border border-white/30 transition-transform duration-[5200ms] [transition-timing-function:cubic-bezier(0.1,0.72,0.08,1)]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background: "conic-gradient(from -60deg, #f5b942 0deg 120deg, #7947ce 120deg 240deg, #16b8c8 240deg 360deg)",
                }}
              >
                <div aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_43%,rgba(0,0,0,0.18)_75%,rgba(0,0,0,0.65)_100%)]" />
                <div aria-hidden className="absolute inset-0 rounded-full opacity-60 [background:repeating-conic-gradient(from_-60deg,transparent_0deg_119deg,rgba(255,255,255,0.9)_119deg_120deg)]" />

                <div className="absolute left-1/2 top-[12%] flex -translate-x-1/2 flex-col items-center text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                  <Crown className="h-7 w-7 text-amber-50 sm:h-10 sm:w-10" aria-hidden />
                  <span className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">50%</span>
                  <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-white/90 sm:text-[10px]">MMG AIRDROP</span>
                </div>
                <div className="absolute right-[9%] top-[59%] flex -translate-y-1/2 flex-col items-center text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                  <Coins className="h-7 w-7 text-violet-50 sm:h-10 sm:w-10" aria-hidden />
                  <span className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">SOL</span>
                  <span className="font-mono text-[8px] font-bold tracking-[0.16em] text-white/90 sm:text-[10px]">AUTO REWARD</span>
                </div>
                <div className="absolute left-[9%] top-[59%] flex -translate-y-1/2 flex-col items-center text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                  <Zap className="h-7 w-7 text-cyan-50 sm:h-10 sm:w-10" aria-hidden />
                  <span className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">4%</span>
                  <span className="font-mono text-[8px] font-bold tracking-[0.12em] text-white/90 sm:text-[10px]">FEE SHARE</span>
                </div>
              </div>

              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#d9ff99] bg-[radial-gradient(circle_at_35%_25%,#263922,#080d09_68%)] shadow-[0_0_0_5px_rgba(5,8,7,0.72),0_0_32px_rgba(190,242,100,0.45)] sm:border-[7px]">
                <Dices className="h-9 w-9 text-lime-100 sm:h-14 sm:w-14" aria-hidden />
              </div>
            </div>
            <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-full border border-lime-300/15" />
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              <Sparkles className="h-3.5 w-3.5 text-lime-200" /> Recompensas anunciadas
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">The top 3 prizes</h2>
            <div className="mt-5 space-y-3">
              {REWARDS.map(({ id, figure, title, description, icon: Icon, color }, index) => (
                <article key={id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-sm transition hover:border-white/20 sm:p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                    <Icon className={`h-6 w-6 ${color}`} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <h3 className="font-bold text-white">{title}</h3>
                      <span className={`font-mono text-sm font-black ${color}`}>{figure}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-neutral-400">{description}</p>
                  </div>
                  <span className="font-mono text-xs text-white/30">0{index + 1}</span>
                </article>
              ))}
            </div>

            {isConnected && address ? (
              <>
                <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/[0.06] px-3 py-2 font-mono text-xs text-lime-100">
                  <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.9)]" />
                  Wallet connected · {address.slice(0, 6)}…{address.slice(-4)}
                </div>
                <button
                  type="button"
                  onClick={spin}
                  disabled={spinning}
                  className="mt-3 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-lime-100/50 bg-[linear-gradient(110deg,#d9ff76,#9ee33e_48%,#c9f86a)] px-6 py-4 text-base font-black uppercase tracking-[0.08em] text-[#10170b] shadow-[0_8px_40px_-12px_rgba(163,230,53,0.8),inset_0_1px_0_rgba(255,255,255,0.65)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70 sm:text-lg"
                >
                  <RotateCw className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`} />
                  {spinning ? "The signal is moving…" : "Spin & reveal your prize"}
                </button>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-lime-200/20 bg-lime-300/[0.045] p-4 text-center sm:p-5">
                <p className="text-base font-bold text-white">Conecta tu wallet para jugar</p>
                <p className="mt-1 text-sm text-neutral-400">Elige una wallet para identificar tu participación.</p>
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      disabled={!mounted}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-lime-100/50 bg-[linear-gradient(110deg,#d9ff76,#9ee33e_48%,#c9f86a)] px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#10170b] shadow-[0_8px_40px_-12px_rgba(163,230,53,0.8),inset_0_1px_0_rgba(255,255,255,0.65)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                    >
                      <Dices className="h-5 w-5" /> {mounted ? "Connect wallet to play" : "Loading wallets…"}
                    </button>
                  )}
                </ConnectButton.Custom>
                <p className="mt-3 text-[10px] leading-5 text-neutral-500">MetaMask, Phantom, Zerion y otras wallets compatibles disponibles en el selector.</p>
              </div>
            )}

            <div aria-live="polite" className="mt-4 min-h-[90px] rounded-2xl border border-lime-200/15 bg-lime-300/[0.035] p-4 text-center">
              {result ? (
                <>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime-200">Illustrative result for {resultWallet ? `${resultWallet.slice(0, 6)}…${resultWallet.slice(-4)}` : "your wallet"}</p>
                  <p className="mt-1 text-lg font-black text-white">{result.figure} · {result.title}</p>
                  <p className="mt-1 text-xs text-neutral-400">{result.description}</p>
                </>
              ) : spinning ? (
                <p className="pt-2 text-sm font-medium text-lime-100">The glitch is choosing one of the three announced rewards…</p>
              ) : (
                <p className="pt-2 text-sm text-neutral-400">The wheel will reveal one of the three prizes.</p>
              )}
            </div>
            <p className="mt-3 text-center text-[10px] leading-5 text-neutral-500">
              Demo wheel only. Results are random illustrations; no tokens, SOL or fees are transferred. The rewards shown are historical claims attributed to MMG, not verified payouts.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
