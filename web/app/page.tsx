"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Clock3, Gamepad2, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { BigHeadSoccer } from "@/components/BigHeadSoccer";

export default function HomePage() {
  const [match, setMatch] = useState(0);

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111b26] px-5 py-8 shadow-2xl shadow-black/30 sm:px-9 sm:py-10 lg:px-12">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(102,219,255,0.16),transparent_38%),radial-gradient(ellipse_at_88%_90%,rgba(185,255,94,0.12),transparent_36%)]" />
        <div aria-hidden className="absolute -right-12 -top-14 select-none text-[13rem] opacity-[0.06] sm:text-[18rem]">⚽</div>
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-lime-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" /> Minijuego destacado
            </div>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-white sm:text-7xl">
              Futboleros<br /><span className="text-[#a8f26c]">Cabezones</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Cabezas enormes, tiros imposibles y rivalidad de barrio. Entra al campo y demuestra quién manda en la cancha.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"><Users className="h-4 w-4 text-[#a8f26c]" /> 2 jugadores</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"><Clock3 className="h-4 w-4 text-[#a8f26c]" /> 90 segundos</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"><ShieldCheck className="h-4 w-4 text-[#a8f26c]" /> Práctica</span>
          </div>
        </div>
      </section>

      <section id="juego" className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101820] shadow-2xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-xl text-slate-950"><Gamepad2 className="h-5 w-5" /></div>
              <div><p className="font-extrabold text-white">Partida local</p><p className="text-xs text-slate-400">Dos jugadores · mismo teclado</p></div>
            </div>
            <button onClick={() => setMatch((value) => value + 1)} className="rounded-xl bg-[#a8f26c] px-5 py-2.5 text-sm font-black text-[#15220d] transition hover:bg-lime-200 active:scale-[0.98]">{match ? "Reiniciar partido" : "Empezar partido"}</button>
          </div>
          <BigHeadSoccer key={match} active={match > 0} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#101820] p-5">
            <h2 className="text-lg font-extrabold text-white">Controles</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#a8f26c]"><span className="h-2.5 w-2.5 rounded-full bg-[#a8f26c]" /> Local</div>
                <div className="flex items-center justify-between text-sm text-slate-300"><span>Moverse</span><span className="font-mono text-xs">A / D</span></div>
                <div className="mt-1 flex items-center justify-between text-sm text-slate-300"><span>Saltar y chutar</span><span className="font-mono text-xs">W</span></div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-300"><span className="h-2.5 w-2.5 rounded-full bg-sky-300" /> Visitante</div>
                <div className="flex items-center justify-between text-sm text-slate-300"><span>Moverse</span><span className="font-mono text-xs">← / →</span></div>
                <div className="mt-1 flex items-center justify-between text-sm text-slate-300"><span>Saltar y chutar</span><span className="font-mono text-xs">↑</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-lime-200/15 bg-lime-200/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-lime-200">Próximo paso</p>
            <h2 className="mt-2 text-lg font-extrabold text-white">Reta a alguien online</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Estamos preparando salas para jugar con otra persona. Esta versión es una demo local: no conecta rivales ni mueve SOL.</p>
            <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-300">Multijugador online · En preparación</div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#101820] p-5">
            <h2 className="text-sm font-extrabold text-white">En desarrollo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">El juego será el primero de una colección de partidas rápidas. La conexión de wallet y cualquier apuesta en SOL se habilitarán después de preparar el sistema de partidas.</p>
          </div>
        </aside>
      </section>

      <section id="como-jugar" className="mt-10 rounded-[1.5rem] border border-white/10 bg-[#101820] p-5 sm:p-7">
        <h2 className="text-xl font-black text-white">¿Cómo se juega?</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { number: "01", title: "Elige tu lado", body: "Un jugador defiende la portería izquierda y el otro la derecha." },
            { number: "02", title: "Salta y remata", body: "Muévete por el campo y usa el salto para golpear la pelota." },
            { number: "03", title: "Marca más goles", body: "Tienes 90 segundos. El marcador más alto gana." },
          ].map((item) => <article key={item.number} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><span className="text-xs font-black tracking-widest text-lime-300">{item.number}</span><h3 className="mt-2 font-bold text-white">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p></article>)}
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><ArrowLeft className="h-3 w-3" /><ArrowRight className="h-3 w-3" /><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Puedes usar las teclas indicadas junto al campo.</p>
      </section>
    </div>
  );
}
