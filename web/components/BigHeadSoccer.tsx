"use client";

import { useEffect, useRef } from "react";

type Player = { x: number; y: number; vx: number; vy: number; color: string; accent: string; face: string; side: 0 | 1 };
type Ball = { x: number; y: number; vx: number; vy: number };
type Match = { players: [Player, Player]; ball: Ball; score: [number, number]; seconds: number; lastTime: number };

const W = 1000;
const H = 480;
const FLOOR = 411;
const held = new Set<string>();
const freshMatch = (): Match => ({
  players: [
    { x: 235, y: FLOOR, vx: 0, vy: 0, color: "#a8f26c", accent: "#365c1e", face: "😎", side: 0 },
    { x: 765, y: FLOOR, vx: 0, vy: 0, color: "#70cfff", accent: "#17456e", face: "🤩", side: 1 },
  ],
  ball: { x: W / 2, y: FLOOR - 19, vx: 0, vy: 0 },
  score: [0, 0], seconds: 90, lastTime: 0,
});

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function draw(ctx: CanvasRenderingContext2D, game: Match, paused: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#94d8ff"); sky.addColorStop(0.65, "#d4f4ff"); sky.addColorStop(0.66, "#72bd58"); sky.addColorStop(1, "#438a3e");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Little stadium crowd and roof lights.
  ctx.fillStyle = "#253449"; ctx.fillRect(0, 88, W, 115);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 46; col++) {
    const colors = ["#ffdf73", "#f87d69", "#f4f5fa", "#75c9f5", "#b6ef78"];
    ctx.fillStyle = colors[(row * 11 + col * 7) % colors.length];
    ctx.beginPath(); ctx.arc(12 + col * 22, 105 + row * 23 + (col % 2) * 3, 3.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#f6ffff";
  for (const x of [96, 904]) {
    ctx.save(); ctx.translate(x, 46); ctx.rotate(x < 500 ? 0.16 : -0.16);
    rounded(ctx, -48, -8, 96, 17, 8); ctx.fillStyle = "#eef9ff"; ctx.fill();
    ctx.fillStyle = "rgba(255,255,220,.18)"; ctx.beginPath(); ctx.moveTo(-42, 5); ctx.lineTo(42, 5); ctx.lineTo(126, 220); ctx.lineTo(-126, 220); ctx.fill(); ctx.restore();
  }

  // Pitch markings.
  ctx.fillStyle = "rgba(35,105,43,.16)";
  for (let i = 0; i < 10; i += 2) ctx.fillRect(i * 100, 204, 100, FLOOR - 204);
  ctx.strokeStyle = "rgba(255,255,255,.84)"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, 204); ctx.lineTo(W / 2, FLOOR); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, 330, 55, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(0, 267, 118, FLOOR - 267); ctx.strokeRect(W - 118, 267, 118, FLOOR - 267);

  // Nets and posts.
  for (const left of [true, false]) {
    const gx = left ? 8 : W - 92;
    ctx.fillStyle = "rgba(255,255,255,.23)"; ctx.fillRect(gx, 305, 84, 105);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 7; ctx.beginPath();
    ctx.moveTo(left ? 88 : W - 88, 305); ctx.lineTo(left ? 8 : W - 8, 305); ctx.lineTo(left ? 8 : W - 8, FLOOR); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(gx + i * 16, 305); ctx.lineTo(gx + i * 16, FLOOR); ctx.stroke(); }
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(gx, 305 + i * 17); ctx.lineTo(gx + 84, 305 + i * 17); ctx.stroke(); }
  }

  // Scoreboard.
  rounded(ctx, 370, 18, 260, 66, 19); ctx.fillStyle = "rgba(13,24,34,.91)"; ctx.fill();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "900 28px system-ui, sans-serif"; ctx.fillStyle = "#a8f26c"; ctx.fillText(String(game.score[0]), 437, 48);
  ctx.fillStyle = "#fff"; ctx.font = "700 13px system-ui, sans-serif"; ctx.fillText("VS", 500, 48);
  ctx.font = "900 28px system-ui, sans-serif"; ctx.fillStyle = "#70cfff"; ctx.fillText(String(game.score[1]), 563, 48);
  rounded(ctx, 460, 91, 80, 31, 12); ctx.fillStyle = "rgba(13,24,34,.88)"; ctx.fill();
  ctx.font = "800 15px ui-monospace, monospace"; ctx.fillStyle = game.seconds < 11 ? "#ff9b88" : "#fff";
  ctx.fillText(`${Math.floor(game.seconds / 60)}:${String(Math.ceil(game.seconds % 60)).padStart(2, "0")}`, 500, 107);

  // Players: chunky shirts, tiny shorts, giant heads.
  for (const p of game.players) {
    const facing = p.side === 0 ? 1 : -1;
    ctx.fillStyle = "rgba(10,30,18,.24)"; ctx.beginPath(); ctx.ellipse(p.x, FLOOR - 1, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.accent; rounded(ctx, p.x - 16, p.y - 20, 14, 22, 6); ctx.fill(); rounded(ctx, p.x + 2, p.y - 20, 14, 22, 6); ctx.fill();
    ctx.fillStyle = p.color; rounded(ctx, p.x - 24, p.y - 66, 48, 48, 15); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.65)"; rounded(ctx, p.x - 3, p.y - 62, 6, 38, 3); ctx.fill();
    ctx.fillStyle = "#ffe0b7"; ctx.beginPath(); ctx.arc(p.x, p.y - 87, 32, 0, Math.PI * 2); ctx.fill();
    ctx.font = "42px system-ui, Apple Color Emoji, Segoe UI Emoji"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.face, p.x, p.y - 87);
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - 121, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "rgba(15,28,38,.88)"; rounded(ctx, p.x - 31, p.y - 4, 62, 19, 8); ctx.fill();
    ctx.font = "800 10px system-ui, sans-serif"; ctx.fillStyle = p.color; ctx.fillText(p.side === 0 ? "LOCAL" : "VISITA", p.x, p.y + 5);
    // A little boot pointing in the direction of play.
    ctx.fillStyle = "#fff"; rounded(ctx, p.x + facing * 13, p.y - 5, 15, 7, 3); ctx.fill();
  }

  // Ball.
  const b = game.ball;
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(b.x, FLOOR - 1, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#182431"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, 16, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; ctx.fillStyle = "#182431"; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 7, b.y + Math.sin(a) * 7, 4, 0, Math.PI * 2); ctx.fill(); }

  if (paused) {
    ctx.fillStyle = "rgba(7,15,22,.43)"; ctx.fillRect(0, 0, W, H);
    rounded(ctx, 275, 165, 450, 125, 24); ctx.fillStyle = "rgba(13,24,34,.95)"; ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 32px system-ui, sans-serif";
    ctx.fillText(game.seconds <= 0 ? (game.score[0] === game.score[1] ? "¡EMPATE!" : game.score[0] > game.score[1] ? "¡GANA LOCAL!" : "¡GANA VISITA!") : "¡A JUGAR!", 500, 207);
    ctx.fillStyle = "#bed0dc"; ctx.font = "600 16px system-ui, sans-serif";
    ctx.fillText(game.seconds <= 0 ? "Pulsa Empezar partido para la revancha" : "Dos jugadores · mismo teclado · sin apuestas", 500, 250);
  }
}

export function BigHeadSoccer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Match>(freshMatch());
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["a", "d", "w", "arrowleft", "arrowright", "arrowup"].includes(key)) event.preventDefault();
      held.add(key);
    };
    const onUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
    const onBlur = () => held.clear();
    window.addEventListener("keydown", onDown); window.addEventListener("keyup", onUp); window.addEventListener("blur", onBlur);
    let frame = 0;

    const tick = (now: number) => {
      const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
      if (ctx) {
        const g = gameRef.current;
        if (activeRef.current && g.seconds > 0 && g.lastTime) {
          const dt = Math.min(0.033, (now - g.lastTime) / 1000);
          g.seconds = Math.max(0, g.seconds - dt);
          for (const p of g.players) {
            const left = p.side === 0 ? held.has("a") : held.has("arrowleft");
            const right = p.side === 0 ? held.has("d") : held.has("arrowright");
            const jump = p.side === 0 ? held.has("w") : held.has("arrowup");
            p.vx = (Number(right) - Number(left)) * 270;
            p.x += p.vx * dt;
            p.x = Math.max(p.side === 0 ? 30 : W / 2 + 10, Math.min(p.side === 0 ? W / 2 - 10 : W - 30, p.x));
            if (jump && p.y >= FLOOR - 1) p.vy = -575;
            p.vy += 1500 * dt; p.y = Math.min(FLOOR, p.y + p.vy * dt);
            if (p.y >= FLOOR) p.vy = 0;
          }
          const b = g.ball;
          b.vy += 1050 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          b.vx *= Math.pow(0.984, dt * 60);
          if (b.y > FLOOR - 16) { b.y = FLOOR - 16; b.vy *= -0.72; if (Math.abs(b.vy) < 40) b.vy = 0; }
          if (b.x < 16 && b.y < 290) { b.x = 16; b.vx = Math.abs(b.vx) * 0.72; }
          if (b.x > W - 16 && b.y < 290) { b.x = W - 16; b.vx = -Math.abs(b.vx) * 0.72; }
          for (const p of g.players) {
            const dx = b.x - p.x; const dy = b.y - (p.y - 59); const distance = Math.hypot(dx, dy);
            if (distance < 50) {
              const side = p.side === 0 ? 1 : -1;
              b.vx = side * Math.min(640, 340 + Math.abs(p.vx) * 0.75 + Math.max(0, -p.vy) * 0.2);
              b.vy = Math.min(b.vy, -230 - Math.max(0, -p.vy) * 0.26);
              b.x = p.x + side * 47;
            }
          }
          if (b.x < 8 && b.y > 305) { g.score[1]++; Object.assign(b, { x: W / 2, y: FLOOR - 22, vx: 0, vy: 0 }); }
          if (b.x > W - 8 && b.y > 305) { g.score[0]++; Object.assign(b, { x: W / 2, y: FLOOR - 22, vx: 0, vy: 0 }); }
          g.lastTime = now;
        } else {
          g.lastTime = activeRef.current ? now : 0;
        }
        draw(ctx, g, !activeRef.current || g.seconds <= 0);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); window.removeEventListener("blur", onBlur); held.clear(); };
  }, []);

  useEffect(() => { gameRef.current = freshMatch(); held.clear(); }, [active]);

  return <div className="bg-[#14232a] p-2 sm:p-3"><canvas ref={canvasRef} width={W} height={H} aria-label="Campo de fútbol de Futboleros Cabezones" className="block h-auto w-full rounded-2xl" /></div>;
}
