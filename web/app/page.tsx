"use client";

import { Bot, Clock3, Gamepad2, ShieldCheck, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BigHeadSoccer, type GameMode, type Team } from "@/components/BigHeadSoccer";

const TEAMS: Team[] = [
  { name: "Lima FC", color: "#a8f26c", accent: "#365c1e", face: "😎" },
  { name: "Costa Azul", color: "#70cfff", accent: "#17456e", face: "🤩" },
  { name: "Rayo Rojo", color: "#ff7777", accent: "#702a35", face: "🥸" },
  { name: "Naranja CF", color: "#ffb457", accent: "#80451f", face: "🤓" },
];

export default function HomePage() {
  const [mode, setMode] = useState<GameMode>("solo");
  const [home, setHome] = useState(TEAMS[0]);
  const [away, setAway] = useState(TEAMS[1]);
  const [match, setMatch] = useState(0);
  const gameKey = `${match}-${mode}-${home.name}-${away.name}`;

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111b26] px-5 py-8 shadow-2xl shadow-black/30 sm:px-9 sm:py-10 lg:px-12">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(102,219,255,0.16),transparent_38%),radial-gradient(ellipse_at_88%_90%,rgba(185,255,94,0.12),transparent_36%)]" />
        <div aria-hidden className="absolute -right-12 -top-14 select-none text-[13rem] opacity-[0.06] sm:text-[18rem]">⚽</div>
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-lime-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" /> Arcade de fútbol
            </div>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.94] tracking-[-0.055em] text-white sm:text-7xl">
              Futboleros<br /><span className="text-[#a8f26c]">Cabezones</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Uno contra uno, cabezazos y tiros a puerta. Elige tu equipo y salta al campo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"><Users className="h-4 w-4 text-[#a8f26c]" /> 1 o 2 jugadores</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"><Clock3 className="h-4 w-4 text-[#a8f26c]" /> 90 segundos</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200"><ShieldCheck className="h-4 w-4 text-[#a8f26c]" /> Partido amistoso</span>
          </div>
        </div>
      </section>

      <section id="juego" className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101820] shadow-2xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-slate-950"><Gamepad2 className="h-5 w-5" /></div>
              <div><p className="font-extrabold text-white">Elige el partido</p><p className="text-xs text-slate-400">Un duelo rápido de fútbol cabezón</p></div>
            </div>
            <button onClick={() => setMatch((value) => value + 1)} className="rounded-xl bg-[#a8f26c] px-5 py-2.5 text-sm font-black text-[#15220d] transition hover:bg-lime-200 active:scale-[0.98]">{match ? "Revancha" : "Jugar"}</button>
          </div>

          <div className="grid gap-4 border-b border-white/[0.07] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-6">
            <TeamPicker label="Local" team={home} onChange={setHome} />
            <span className="justify-self-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-400">VS</span>
            <TeamPicker label={mode === "solo" ? "Rival CPU" : "Visitante"} team={away} onChange={setAway} />
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-white/[0.07] p-3 sm:px-6">
            <ModeButton active={mode === "solo"} onClick={() => setMode("solo")} icon={<Bot className="h-4 w-4" />} title="Un jugador" subtitle="Contra la CPU" />
            <ModeButton active={mode === "local"} onClick={() => setMode("local")} icon={<Users className="h-4 w-4" />} title="Dos jugadores" subtitle="Mismo teclado" />
          </div>

          <BigHeadSoccer key={gameKey} active={match > 0} mode={mode} home={home} away={away} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#101820] p-5">
            <h2 className="text-lg font-extrabold text-white">Controles</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: home.color }}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: home.color }} /> {home.name}</div>
                <KeyRow label="Moverse" keys="A / D" />
                <KeyRow label="Saltar" keys="W" />
                <KeyRow label="Tirar" keys="F" />
              </div>
              {mode === "local" && <div className="border-t border-white/10 pt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: away.color }}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: away.color }} /> {away.name}</div>
                <KeyRow label="Moverse" keys="← / →" />
                <KeyRow label="Saltar" keys="↑" />
                <KeyRow label="Tirar" keys="M" />
              </div>}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-lime-200/15 bg-lime-200/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-lime-200">Siguiente modo</p>
            <h2 className="mt-2 text-lg font-extrabold text-white">Reta a alguien online</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">El duelo online y las partidas con jugadores reales están en preparación. Esta versión es local y no mueve SOL.</p>
            <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-300">Multijugador online · En preparación</div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#101820] p-5">
            <h2 className="text-sm font-extrabold text-white">Reglas rápidas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">90 segundos para marcar. Salta para alcanzar balones altos y usa el tiro para mandar la pelota hacia la portería rival.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function TeamPicker({ label, team, onChange }: { label: string; team: Team; onChange: (team: Team) => void }) {
  return <label className="flex min-w-0 items-center gap-3">
    <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    <select value={team.name} onChange={(event) => onChange(TEAMS.find((item) => item.name === event.target.value) ?? TEAMS[0])} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#16222d] px-3 py-2 text-sm font-bold text-white outline-none focus:border-lime-300/40">
      {TEAMS.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
    </select>
    <span aria-hidden className="h-7 w-7 shrink-0 rounded-lg border border-white/10" style={{ background: `linear-gradient(135deg, ${team.color}, ${team.accent})` }} />
  </label>;
}

function ModeButton({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; subtitle: string }) {
  return <button onClick={onClick} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-lime-200/30 bg-lime-200/[0.09]" : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]"}`}>
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[#a8f26c] text-[#15220d]" : "bg-white/[0.06] text-slate-300"}`}>{icon}</span>
    <span className="min-w-0"><span className="block text-sm font-extrabold text-white">{title}</span><span className="mt-0.5 block text-xs text-slate-400">{subtitle}</span></span>
  </button>;
}

function KeyRow({ label, keys }: { label: string; keys: string }) {
  return <div className="mt-1 flex items-center justify-between text-sm text-slate-300"><span>{label}</span><span className="font-mono text-xs text-slate-400">{keys}</span></div>;
}
