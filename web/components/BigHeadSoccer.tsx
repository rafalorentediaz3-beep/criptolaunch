"use client";

import { useEffect, useRef, useState } from "react";
import {
  WIDTH as W, HEIGHT as H, FLOOR, GOAL_TOP, GOAL_LINE, GOAL_BACK, GOAL_FRAME_RADIUS,
  createMatch, stepMatch, kickAngle, idleControls,
  type GameMode, type Team, type Match, type Player, type Controls,
} from "@/lib/soccer";
export type { GameMode, Team } from "@/lib/soccer";

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  // quadraticCurveTo also works on browsers without Canvas.roundRect.
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  const direction = player.side === 0 ? 1 : -1;
  ctx.fillStyle = "rgba(12,40,25,.24)";
  ctx.beginPath(); ctx.ellipse(player.x, FLOOR + 2, 37, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(player.x, player.y); ctx.scale(direction, 1);
  ctx.strokeStyle = "#172334"; ctx.lineWidth = 2.5;
  // Supporting leg and boot.
  ctx.fillStyle = player.skin; rounded(ctx, -15, -22, 11, 16, 4); ctx.fill();
  ctx.fillStyle = "#f4f7fc"; rounded(ctx, -22, -10, 29, 12, 5); ctx.fill(); ctx.stroke();
  // Short kit under an oversized illustrated head.
  ctx.fillStyle = player.accent; rounded(ctx, -20, -28, 40, 14, 4); ctx.fill();
  ctx.fillStyle = player.color; rounded(ctx, -23, -51, 46, 31, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(-3, -48, 6, 23);
  ctx.fillStyle = player.skin;
  ctx.beginPath(); ctx.ellipse(0, -78, 37, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Ear, cheeks and jaw shading.
  ctx.beginPath(); ctx.ellipse(-34, -73, 7, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(112,48,20,.13)";
  ctx.beginPath(); ctx.ellipse(-9, -53, 24, 10, 0, 0, Math.PI); ctx.fill();
  // Four distinct haircuts, all drawn as game art rather than emoji skins.
  ctx.fillStyle = player.hair; ctx.beginPath();
  ctx.moveTo(-35, -78); ctx.lineTo(-38, -101);
  if (player.hairstyle === "quiff") {
    ctx.lineTo(-19, -122); ctx.lineTo(-8, -114); ctx.lineTo(18, -131); ctx.lineTo(35, -113);
  } else if (player.hairstyle === "curly") {
    for (let i = 0; i < 7; i++) ctx.lineTo(-33 + i * 11, -112 - (i % 2) * 9);
  } else if (player.hairstyle === "swept") {
    ctx.lineTo(-14, -120); ctx.lineTo(34, -113); ctx.lineTo(39, -91); ctx.lineTo(8, -106);
  } else {
    ctx.lineTo(-21, -115); ctx.lineTo(24, -115); ctx.lineTo(36, -100);
  }
  ctx.lineTo(32, -88); ctx.lineTo(18, -102); ctx.lineTo(-18, -102); ctx.lineTo(-27, -76); ctx.closePath(); ctx.fill();
  // Eyebrows and expressive eyes face the opposing goal.
  ctx.strokeStyle = player.hair; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-14, -89); ctx.lineTo(-1, -91); ctx.moveTo(12, -91); ctx.lineTo(27, -87); ctx.stroke();
  ctx.fillStyle = "white";
  for (const x of [-7, 20]) { ctx.beginPath(); ctx.ellipse(x, -80, 8, 10, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#192737";
  for (const x of [-3, 24]) { ctx.beginPath(); ctx.arc(x, -79, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = "rgba(111,56,34,.65)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, -77); ctx.lineTo(14, -67); ctx.lineTo(8, -65); ctx.stroke();
  ctx.fillStyle = "#fdfaf1"; ctx.strokeStyle = "#713f35";
  ctx.beginPath(); ctx.moveTo(-6, -58); ctx.quadraticCurveTo(11, -51, 25, -60); ctx.quadraticCurveTo(10, -40, -6, -58); ctx.fill(); ctx.stroke();
  // Render the swinging foot in front so the large head cannot hide the shot.
  ctx.save(); ctx.translate(0, -18); ctx.rotate(kickAngle(player));
  ctx.strokeStyle = player.skin; ctx.lineWidth = 11; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(26, 9); ctx.stroke();
  ctx.fillStyle = "#f5f8ff"; ctx.strokeStyle = "#172334"; ctx.lineWidth = 2.5;
  rounded(ctx, 20, 2, 32, 15, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = player.accent; ctx.fillRect(25, 5, 15, 4);
  ctx.restore();
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, game: Match, mode: GameMode) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#8bcfff"); sky.addColorStop(0.42, "#d7f2ff"); sky.addColorStop(0.425, "#78c35b"); sky.addColorStop(1, "#448b3c");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // A compact, original cartoon stadium.
  ctx.fillStyle = "#26374a"; ctx.fillRect(0, 88, W, 115);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 46; col++) {
    const colors = ["#ffdf73", "#f87d69", "#f4f5fa", "#75c9f5", "#b6ef78"];
    ctx.fillStyle = colors[(row * 11 + col * 7) % colors.length];
    ctx.beginPath(); ctx.arc(12 + col * 22, 105 + row * 23 + (col % 2) * 3, 3.3, 0, Math.PI * 2); ctx.fill();
  }
  for (const x of [96, 904]) {
    ctx.save(); ctx.translate(x, 46); ctx.rotate(x < 500 ? 0.16 : -0.16);
    rounded(ctx, -48, -8, 96, 17, 8); ctx.fillStyle = "#eef9ff"; ctx.fill();
    ctx.fillStyle = "rgba(255,255,220,.18)"; ctx.beginPath(); ctx.moveTo(-42, 5); ctx.lineTo(42, 5); ctx.lineTo(126, 220); ctx.lineTo(-126, 220); ctx.fill(); ctx.restore();
  }

  // Pitch, penalty boxes, center circle and goals.
  ctx.fillStyle = "rgba(35,105,43,.16)";
  for (let i = 0; i < 10; i += 2) ctx.fillRect(i * 100, 204, 100, FLOOR - 204);
  ctx.strokeStyle = "rgba(255,255,255,.84)"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, 204); ctx.lineTo(W / 2, FLOOR); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, 330, 55, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(0, 267, 118, FLOOR - 267); ctx.strokeRect(W - 118, 267, 118, FLOOR - 267);
  for (const left of [true, false]) {
    const gx = left ? GOAL_BACK : W - GOAL_LINE;
    const width = GOAL_LINE - GOAL_BACK;
    const front = left ? GOAL_LINE : W - GOAL_LINE;
    const back = left ? GOAL_BACK : W - GOAL_BACK;
    ctx.save();
    ctx.fillStyle = "rgba(13,47,24,.2)";
    ctx.beginPath(); ctx.ellipse(gx + width / 2, FLOOR + 3, width / 2 + 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    // The side net has depth, a rear support and a solid horizontal roof.
    ctx.fillStyle = "rgba(238,248,255,.15)"; ctx.fillRect(gx, GOAL_TOP, width, FLOOR - GOAL_TOP);
    ctx.strokeStyle = "rgba(255,255,255,.58)"; ctx.lineWidth = 1;
    for (let x = gx + 12; x < gx + width; x += 12) { ctx.beginPath(); ctx.moveTo(x, GOAL_TOP); ctx.lineTo(x, FLOOR); ctx.stroke(); }
    for (let y = GOAL_TOP + 12; y < FLOOR; y += 12) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + width, y); ctx.stroke(); }
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(23,48,57,.35)"; ctx.lineWidth = GOAL_FRAME_RADIUS * 2 + 3;
    ctx.beginPath(); ctx.moveTo(back, FLOOR); ctx.lineTo(back, GOAL_TOP); ctx.lineTo(front, GOAL_TOP); ctx.lineTo(front, FLOOR); ctx.stroke();
    ctx.strokeStyle = "#e3edf3"; ctx.lineWidth = GOAL_FRAME_RADIUS * 2;
    ctx.beginPath(); ctx.moveTo(back, FLOOR); ctx.lineTo(back, GOAL_TOP); ctx.lineTo(front, GOAL_TOP); ctx.lineTo(front, FLOOR); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gx, GOAL_TOP - 2); ctx.lineTo(gx + width, GOAL_TOP - 2); ctx.moveTo(gx, FLOOR); ctx.lineTo(gx + width, FLOOR); ctx.stroke();
    ctx.restore();
  }

  // Scoreboard with each team's name and kit color.
  rounded(ctx, 350, 15, 300, 74, 18); ctx.fillStyle = "rgba(13,24,34,.93)"; ctx.fill();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "800 11px system-ui, sans-serif"; ctx.fillStyle = game.players[0].color; ctx.fillText(shortName(game.players[0].name), 420, 31);
  ctx.fillStyle = game.players[1].color; ctx.fillText(mode === "solo" ? "CPU" : shortName(game.players[1].name), 580, 31);
  ctx.font = "900 30px system-ui, sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(`${game.score[0]}  :  ${game.score[1]}`, 500, 61);
  rounded(ctx, 460, 96, 80, 31, 12); ctx.fillStyle = "rgba(13,24,34,.88)"; ctx.fill();
  ctx.font = "800 15px ui-monospace, monospace"; ctx.fillStyle = game.seconds < 11 ? "#ff9b88" : "#fff";
  const time = Math.ceil(game.seconds);
  ctx.fillText(`${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`, 500, 112);

  for (const player of game.players) drawPlayer(ctx, player);

  const b = game.ball;
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(b.x, FLOOR - 1, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#182431"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; ctx.fillStyle = "#182431"; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 7, b.y + Math.sin(a) * 7, 4, 0, Math.PI * 2); ctx.fill(); }

  if (game.phase === "goal") {
    ctx.fillStyle = "rgba(7,15,22,.46)"; ctx.fillRect(0, 0, W, H);
    rounded(ctx, 265, 158, 470, 139, 24); ctx.fillStyle = "rgba(13,24,34,.96)"; ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 32px system-ui, sans-serif";
    ctx.fillText("¡GOOOOL!", 500, 204);
    ctx.fillStyle = "#bed0dc"; ctx.font = "600 15px system-ui, sans-serif";
    ctx.fillText(game.scorer === null ? "" : game.players[game.scorer].name, 500, 251);
  }
}

function shortName(name: string) {
  return name.length > 13 ? `${name.slice(0, 12)}…` : name.toUpperCase();
}

export function BigHeadSoccer({ active, mode, home, away, onStart }: { active: boolean; mode: GameMode; home: Team; away: Team; onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Match>(createMatch(home, away));
  const heldRef = useRef(new Set<string>());
  const queuedRef = useRef(new Set<string>());
  const stateRef = useRef({ active, mode, paused: false });
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({ phase: "playing" as Match["phase"], score: [0, 0] as [number, number] });
  const [error, setError] = useState("");
  stateRef.current = { active, mode, paused };

  function input(key: string, down: boolean) {
    if (down) {
      heldRef.current.add(key);
      // Preserve short taps until the simulation consumes them.
      queuedRef.current.add(key);
    } else heldRef.current.delete(key);
  }

  useEffect(() => {
    const playable = new Set(["KeyA", "KeyD", "KeyW", "KeyF", "ArrowLeft", "ArrowRight", "ArrowUp", "KeyM", "Space"]);
    const clear = () => { heldRef.current.clear(); queuedRef.current.clear(); };
    const onDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Escape" && stateRef.current.active) { setPaused((value) => !value); clear(); return; }
      if (!playable.has(event.code) || !stateRef.current.active || stateRef.current.paused) return;
      event.preventDefault();
      heldRef.current.add(event.code);
      if (!event.repeat) queuedRef.current.add(event.code);
    };
    const onUp = (event: KeyboardEvent) => { heldRef.current.delete(event.code); };
    const onBlur = () => { clear(); if (stateRef.current.active) setPaused(true); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let reportedPhase: Match["phase"] = "playing";
    const fixedStep = 1 / 120;
    const tick = (now: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) { setError("No se pudo abrir el campo de juego en este navegador."); return; }
      const state = stateRef.current;
      const elapsed = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
      previous = now;
      if (state.active && !state.paused) {
        accumulator += elapsed;
        while (accumulator >= fixedStep) {
          const isDown = (...keys: string[]) => keys.some((key) => heldRef.current.has(key) || queuedRef.current.has(key));
          const local: Controls = {
            left: isDown("KeyA", ...(state.mode === "solo" ? ["ArrowLeft"] : [])),
            right: isDown("KeyD", ...(state.mode === "solo" ? ["ArrowRight"] : [])),
            jump: isDown("KeyW", ...(state.mode === "solo" ? ["ArrowUp"] : [])),
            shoot: isDown("KeyF", ...(state.mode === "solo" ? ["Space"] : [])),
          };
          const visitor: Controls = state.mode === "local" ? {
            left: isDown("ArrowLeft"), right: isDown("ArrowRight"), jump: isDown("ArrowUp"), shoot: isDown("KeyM"),
          } : idleControls();
          stepMatch(gameRef.current, [local, visitor], fixedStep, state.mode);
          queuedRef.current.clear();
          accumulator -= fixedStep;
        }
      } else {
        accumulator = 0;
        clear();
      }
      draw(ctx, gameRef.current, state.mode);
      if (gameRef.current.phase !== reportedPhase) {
        reportedPhase = gameRef.current.phase;
        setHud({ phase: reportedPhase, score: [...gameRef.current.score] as [number, number] });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      clear();
    };
  }, []);

  useEffect(() => {
    gameRef.current = createMatch(home, away);
    heldRef.current.clear(); queuedRef.current.clear();
    setPaused(false);
    setHud({ phase: "playing", score: [0, 0] });
  }, [active, home, away, mode]);

  const finished = hud.phase === "finished";
  const result = hud.score[0] === hud.score[1] ? "¡Empate!" : hud.score[0] > hud.score[1] ? `¡Gana ${home.name}!` : `¡Gana ${mode === "solo" ? "la CPU" : away.name}!`;
  return <div className="bg-[#14232a] p-2 sm:p-3">
    <div className="relative overflow-hidden rounded-2xl">
      <canvas ref={canvasRef} width={W} height={H} aria-label="Campo de fútbol: moverse A/D, saltar W, tirar F" className="block h-auto w-full" />
      {(!active || paused || finished || error) && <div className="absolute inset-0 flex items-center justify-center bg-[#07121a]/65 p-3">
        <div className="max-w-sm rounded-2xl border border-white/15 bg-[#10202d]/95 p-4 text-center shadow-2xl sm:p-6">
          <h2 className="text-xl font-black text-white sm:text-3xl">{error || (finished ? result : paused ? "Partido en pausa" : "¡Listos para el saque!")}</h2>
          <p className="mt-2 text-xs text-slate-300 sm:text-sm">{finished ? `Resultado final: ${hud.score[0]} – ${hud.score[1]}` : "Corre, salta y pulsa TIRO para mover el pie y chutar."}</p>
          {!error && <button type="button" onClick={paused && !finished ? () => setPaused(false) : onStart} className="mt-4 rounded-xl bg-lime-300 px-7 py-3 text-sm font-black text-slate-950">{finished ? "Revancha" : paused ? "Continuar" : "Jugar ahora"}</button>}
        </div>
      </div>}
    </div>
    <div className="mt-3 flex items-center justify-between gap-2 px-1">
      <p className="text-xs font-semibold text-slate-300">{!active ? "Elige tus equipos y pulsa Jugar." : finished ? "Partido terminado" : paused ? "Pausa" : "Partido en curso"}</p>
      <button type="button" disabled={!active || finished} onClick={() => setPaused((value) => !value)} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{paused ? "Continuar" : "Pausar"}</button>
    </div>
    <div className={`mt-3 grid gap-3 ${mode === "local" ? "sm:grid-cols-2" : "max-w-md"}`}>
      <ControlCluster title={home.name} color={home.color} keys={["KeyA", "KeyD", "KeyW", "KeyF"]} disabled={!active || paused || finished} onInput={input} />
      {mode === "local" && <ControlCluster title={away.name} color={away.color} keys={["ArrowLeft", "ArrowRight", "ArrowUp", "KeyM"]} disabled={!active || paused || finished} onInput={input} />}
    </div>
    <p className="px-1 pt-2 text-center text-[11px] text-slate-400">{mode === "solo" ? "Teclado: A/D o flechas · W o ↑ para saltar · F o espacio para tirar." : "Local: A/D, W, F · Visitante: ←/→, ↑, M."} También puedes mantener pulsados los botones.</p>
  </div>;
}

function ControlCluster({ title, color, keys, disabled, onInput }: {
  title: string; color: string; keys: string[]; disabled: boolean; onInput: (key: string, down: boolean) => void;
}) {
  const labels = ["◀", "▶", "SALTAR", "TIRO"];
  return <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
    <p className="mb-2 text-center text-[10px] font-black uppercase tracking-wider" style={{ color }}>{title}</p>
    <div className="grid grid-cols-[44px_44px_1fr_1fr] gap-2">
      {keys.map((key, index) => <button
        key={key} type="button" disabled={disabled} aria-label={`${title}: ${["izquierda", "derecha", "saltar", "tirar"][index]}`}
        onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); onInput(key, true); }}
        onPointerUp={() => onInput(key, false)}
        onPointerCancel={() => onInput(key, false)}
        onLostPointerCapture={() => onInput(key, false)}
        onClick={(event) => { if (event.detail === 0) { onInput(key, true); onInput(key, false); } }}
        onContextMenu={(event) => event.preventDefault()}
        className={`h-12 touch-none select-none rounded-xl border font-black transition active:scale-95 disabled:opacity-35 ${index === 3 ? "border-lime-200/30 bg-lime-300 text-slate-950 active:bg-lime-200" : "border-white/10 bg-white/[0.07] text-white active:bg-white/20"} ${index < 2 ? "text-xl" : "text-[10px] sm:text-xs"}`}
      >{labels[index]}</button>)}
    </div>
  </div>;
}
