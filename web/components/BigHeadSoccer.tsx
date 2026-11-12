"use client";

import { useEffect, useRef } from "react";

export type GameMode = "solo" | "local";
export type Team = { name: string; color: string; accent: string; face: string };
type Player = Team & { x: number; y: number; vx: number; vy: number; side: 0 | 1; jumpLock: boolean; kickCooldown: number };
type Ball = { x: number; y: number; vx: number; vy: number };
type Match = { players: [Player, Player]; ball: Ball; score: [number, number]; seconds: number; lastTime: number };

const W = 1000;
const H = 480;
const FLOOR = 411;
const held = new Set<string>();
const makePlayer = (team: Team, x: number, side: 0 | 1): Player => ({ ...team, x, y: FLOOR, vx: 0, vy: 0, side, jumpLock: false, kickCooldown: 0 });
const freshMatch = (home: Team, away: Team): Match => ({
  players: [makePlayer(home, 235, 0), makePlayer(away, 765, 1)],
  ball: { x: W / 2, y: FLOOR - 19, vx: 0, vy: 0 },
  score: [0, 0], seconds: 90, lastTime: 0,
});

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function draw(ctx: CanvasRenderingContext2D, game: Match, paused: boolean, mode: GameMode) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#8bcfff"); sky.addColorStop(0.62, "#d7f2ff"); sky.addColorStop(0.63, "#78c35b"); sky.addColorStop(1, "#448b3c");
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
    const gx = left ? 8 : W - 92;
    ctx.fillStyle = "rgba(255,255,255,.23)"; ctx.fillRect(gx, 305, 84, 105);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 7; ctx.beginPath();
    ctx.moveTo(left ? 88 : W - 88, 305); ctx.lineTo(left ? 8 : W - 8, 305); ctx.lineTo(left ? 8 : W - 8, FLOOR); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(gx + i * 16, 305); ctx.lineTo(gx + i * 16, FLOOR); ctx.stroke(); }
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(gx, 305 + i * 17); ctx.lineTo(gx + 84, 305 + i * 17); ctx.stroke(); }
  }

  // Scoreboard with each team's name and kit color.
  rounded(ctx, 350, 15, 300, 74, 18); ctx.fillStyle = "rgba(13,24,34,.93)"; ctx.fill();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "800 11px system-ui, sans-serif"; ctx.fillStyle = game.players[0].color; ctx.fillText(shortName(game.players[0].name), 420, 31);
  ctx.fillStyle = game.players[1].color; ctx.fillText(mode === "solo" ? "CPU" : shortName(game.players[1].name), 580, 31);
  ctx.font = "900 30px system-ui, sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(`${game.score[0]}  :  ${game.score[1]}`, 500, 61);
  rounded(ctx, 460, 96, 80, 31, 12); ctx.fillStyle = "rgba(13,24,34,.88)"; ctx.fill();
  ctx.font = "800 15px ui-monospace, monospace"; ctx.fillStyle = game.seconds < 11 ? "#ff9b88" : "#fff";
  ctx.fillText(`${Math.floor(game.seconds / 60)}:${String(Math.ceil(game.seconds % 60)).padStart(2, "0")}`, 500, 112);

  // Original big-head footballers, assembled from canvas shapes and emoji faces.
  for (const p of game.players) {
    const facing = p.side === 0 ? 1 : -1;
    ctx.fillStyle = "rgba(10,30,18,.24)"; ctx.beginPath(); ctx.ellipse(p.x, FLOOR - 1, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.accent; rounded(ctx, p.x - 16, p.y - 20, 14, 22, 6); ctx.fill(); rounded(ctx, p.x + 2, p.y - 20, 14, 22, 6); ctx.fill();
    ctx.fillStyle = p.color; rounded(ctx, p.x - 24, p.y - 66, 48, 48, 15); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.65)"; rounded(ctx, p.x - 3, p.y - 62, 6, 38, 3); ctx.fill();
    ctx.fillStyle = "#ffe0b7"; ctx.beginPath(); ctx.arc(p.x, p.y - 87, 32, 0, Math.PI * 2); ctx.fill();
    ctx.font = "42px system-ui, Apple Color Emoji, Segoe UI Emoji"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.face, p.x, p.y - 87);
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - 121, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#fff"; rounded(ctx, p.x + facing * 13, p.y - 5, 15, 7, 3); ctx.fill();
  }

  const b = game.ball;
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(b.x, FLOOR - 1, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#182431"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; ctx.fillStyle = "#182431"; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 7, b.y + Math.sin(a) * 7, 4, 0, Math.PI * 2); ctx.fill(); }

  if (paused) {
    ctx.fillStyle = "rgba(7,15,22,.46)"; ctx.fillRect(0, 0, W, H);
    rounded(ctx, 265, 158, 470, 139, 24); ctx.fillStyle = "rgba(13,24,34,.96)"; ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 32px system-ui, sans-serif";
    const result = game.score[0] === game.score[1] ? "¡EMPATE!" : game.score[0] > game.score[1] ? `¡GANA ${shortName(game.players[0].name)}!` : `¡GANA ${mode === "solo" ? "CPU" : shortName(game.players[1].name)}!`;
    ctx.fillText(game.seconds <= 0 ? result : "ELIGE EQUIPOS Y PULSA JUGAR", 500, 204);
    ctx.fillStyle = "#bed0dc"; ctx.font = "600 15px system-ui, sans-serif";
    ctx.fillText(game.seconds <= 0 ? "Pulsa Revancha para otro partido" : mode === "solo" ? "Muévete, salta y dispara a puerta" : "Dos jugadores · mismo teclado · sin apuestas", 500, 251);
  }
}

function shortName(name: string) {
  return name.length > 13 ? `${name.slice(0, 12)}…` : name.toUpperCase();
}

export function BigHeadSoccer({ active, mode, home, away }: { active: boolean; mode: GameMode; home: Team; away: Team }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Match>(freshMatch(home, away));
  const activeRef = useRef(active);
  const modeRef = useRef(mode);
  activeRef.current = active; modeRef.current = mode;

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["a", "d", "w", "f", "arrowleft", "arrowright", "arrowup", "m"].includes(key)) event.preventDefault();
      held.add(key);
    };
    const onUp = (event: KeyboardEvent) => { held.delete(event.key.toLowerCase()); };
    const onBlur = () => held.clear();
    window.addEventListener("keydown", onDown); window.addEventListener("keyup", onUp); window.addEventListener("blur", onBlur);
    let frame = 0;

    const tick = (now: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const g = gameRef.current;
        if (activeRef.current && g.seconds > 0 && g.lastTime) {
          const dt = Math.min(0.033, (now - g.lastTime) / 1000);
          g.seconds = Math.max(0, g.seconds - dt);
          const b = g.ball;
          for (const p of g.players) {
            const dx = b.x - p.x;
            const bodyY = Math.max(p.y - 66, Math.min(p.y - 18, b.y));
            const bodyDistance = Math.hypot(dx, b.y - bodyY);
            const headDistance = Math.hypot(dx, b.y - (p.y - 87));
            const distance = Math.min(bodyDistance, headDistance);
            p.kickCooldown = Math.max(0, p.kickCooldown - dt);
            let left: boolean; let right: boolean; let jump: boolean; let shoot: boolean;
            if (modeRef.current === "solo" && p.side === 1) {
              const targetX = b.x > W * 0.57 ? b.x - 46 : 680;
              left = targetX < p.x - 18; right = targetX > p.x + 18;
              jump = distance < 155 && b.y < p.y - 62;
              shoot = distance < 62;
            } else {
              left = p.side === 0 ? held.has("a") : held.has("arrowleft");
              right = p.side === 0 ? held.has("d") : held.has("arrowright");
              jump = p.side === 0 ? held.has("w") : held.has("arrowup");
              shoot = p.side === 0 ? held.has("f") : held.has("m");
            }
            p.vx = (Number(right) - Number(left)) * 285;
            p.x += p.vx * dt;
            p.x = Math.max(27, Math.min(W - 27, p.x));
            if (jump && p.y >= FLOOR - 1 && !p.jumpLock) { p.vy = -590; p.jumpLock = true; }
            if (!jump) p.jumpLock = false;
            p.vy += 1500 * dt; p.y = Math.min(FLOOR, p.y + p.vy * dt);
            if (p.y >= FLOOR) p.vy = 0;

            if (distance < 48 && p.kickCooldown === 0) {
              const direction = p.side === 0 ? 1 : -1;
              const runPower = Math.min(130, Math.abs(p.vx) * 0.35);
              b.vx = direction * (shoot ? 650 + runPower : 285 + runPower);
              b.vy = shoot ? -440 - Math.max(0, -p.vy) * 0.12 : -285;
              b.x = p.x + direction * 43;
              b.y = Math.min(b.y, p.y - 50);
              p.kickCooldown = shoot ? 0.3 : 0.22;
            }
          }

          // The two players bump shoulders instead of passing through one another.
          const [leftPlayer, rightPlayer] = g.players;
          if (Math.abs(leftPlayer.x - rightPlayer.x) < 45 && Math.abs(leftPlayer.y - rightPlayer.y) < 42) {
            const push = (45 - Math.abs(leftPlayer.x - rightPlayer.x)) / 2;
            leftPlayer.x -= push; rightPlayer.x += push;
          }

          b.vy += 1050 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          b.vx *= Math.pow(0.984, dt * 60);
          if (b.y > FLOOR - 16) { b.y = FLOOR - 16; b.vy *= -0.72; if (Math.abs(b.vy) < 40) b.vy = 0; }
          if (b.y < 220) { b.y = 220; b.vy = Math.abs(b.vy) * 0.75; }
          if (b.x < 16 && b.y < 305) { b.x = 16; b.vx = Math.abs(b.vx) * 0.72; }
          if (b.x > W - 16 && b.y < 305) { b.x = W - 16; b.vx = -Math.abs(b.vx) * 0.72; }
          if (b.x < 8 && b.y >= 305) { g.score[1]++; Object.assign(b, { x: W / 2, y: FLOOR - 22, vx: 0, vy: 0 }); }
          if (b.x > W - 8 && b.y >= 305) { g.score[0]++; Object.assign(b, { x: W / 2, y: FLOOR - 22, vx: 0, vy: 0 }); }
          g.lastTime = now;
        } else {
          g.lastTime = activeRef.current && g.seconds > 0 ? now : 0;
        }
        draw(ctx, g, !activeRef.current || g.seconds <= 0, modeRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); window.removeEventListener("blur", onBlur); held.clear(); };
  }, []);

  useEffect(() => { gameRef.current = freshMatch(home, away); held.clear(); }, [active, home, away, mode]);

  return <div className="bg-[#14232a] p-2 sm:p-3">
    <canvas ref={canvasRef} width={W} height={H} aria-label="Campo de fútbol de Futboleros Cabezones" className="block h-auto w-full rounded-2xl" />
    <div className={`mt-3 grid gap-3 ${mode === "local" ? "sm:grid-cols-2" : "max-w-md"}`}>
      <ControlCluster title={home.name} color={home.color} keys={["a", "d", "w", "f"]} labels={["◀", "▶", "SALTAR", "TIRO"]} />
      {mode === "local" && <ControlCluster title={away.name} color={away.color} keys={["arrowleft", "arrowright", "arrowup", "m"]} labels={["◀", "▶", "SALTAR", "TIRO"]} />}
    </div>
    <p className="px-1 pt-2 text-center text-[11px] text-slate-400">Pulsa los botones o usa el teclado. El botón de tiro patea el balón al estar cerca.</p>
  </div>;
}

function ControlCluster({ title, color, keys, labels }: { title: string; color: string; keys: string[]; labels: string[] }) {
  return <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
    <p className="mb-2 text-center text-[10px] font-black uppercase tracking-wider" style={{ color }}>{title}</p>
    <div className="flex justify-center gap-2">
      {keys.map((key, index) => <button
        key={key}
        type="button"
        aria-label={`${title}: ${labels[index]}`}
        onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); held.add(key); }}
        onPointerUp={() => held.delete(key)}
        onPointerCancel={() => held.delete(key)}
        onLostPointerCapture={() => held.delete(key)}
        className={`touch-none select-none rounded-xl border border-white/10 bg-white/[0.06] font-black text-white active:scale-95 active:bg-lime-300/20 ${index < 2 ? "h-12 w-12 text-xl" : "h-12 min-w-20 px-3 text-xs"}`}
      >{labels[index]}</button>)}
    </div>
  </div>;
}
