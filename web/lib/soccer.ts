export type GameMode = "solo" | "local";
export type Team = {
  name: string;
  color: string;
  accent: string;
  skin: string;
  hair: string;
  hairstyle: "crop" | "quiff" | "curly" | "swept";
};
export type Controls = { left: boolean; right: boolean; jump: boolean; shoot: boolean };
export type Player = Team & {
  x: number; y: number; vx: number; vy: number; side: 0 | 1;
  jumpHeld: boolean; kickTime: number; kickCooldown: number; kickHit: boolean;
};
export type Match = {
  players: [Player, Player];
  ball: { x: number; y: number; vx: number; vy: number; spin: number };
  score: [number, number]; seconds: number;
  phase: "playing" | "goal" | "finished"; goalDelay: number; scorer: 0 | 1 | null;
};

export const WIDTH = 1000;
export const HEIGHT = 480;
export const FLOOR = 420;
export const GOAL_LINE = 82;
export const GOAL_TOP = 270;
export const GOAL_BACK = 10;
export const GOAL_FRAME_RADIUS = 5;
export const BALL_RADIUS = 15;
export const KICK_DURATION = 0.3;
export const idleControls = (): Controls => ({ left: false, right: false, jump: false, shoot: false });
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createMatch(home: Team, away: Team): Match {
  const player = (team: Team, x: number, side: 0 | 1): Player => ({
    ...team, x, y: FLOOR, vx: 0, vy: 0, side,
    jumpHeld: false, kickTime: 0, kickCooldown: 0, kickHit: false,
  });
  return {
    players: [player(home, 260, 0), player(away, 740, 1)],
    ball: { x: WIDTH / 2, y: FLOOR - BALL_RADIUS, vx: 0, vy: 0, spin: 0 },
    score: [0, 0], seconds: 90, phase: "playing", goalDelay: 0, scorer: null,
  };
}

export function kickAngle(player: Player): number {
  return player.kickTime > 0 ? -Math.sin((1 - player.kickTime / KICK_DURATION) * Math.PI) * 0.95 : 0;
}

export function footPosition(player: Player) {
  const angle = kickAngle(player);
  const facing = player.side === 0 ? 1 : -1;
  return {
    x: player.x + facing * (Math.cos(angle) * 37 - Math.sin(angle) * 9),
    y: player.y - 18 + Math.sin(angle) * 37 + Math.cos(angle) * 9,
  };
}

export function cpuControls(game: Match): Controls {
  const player = game.players[1];
  const ball = game.ball;
  // Approach from behind the ball so the CPU kicks toward the left goal.
  const target = clamp(ball.x + 42, 135, WIDTH - 100);
  const near = Math.abs(ball.x - player.x) < 105;
  return {
    left: target < player.x - 16,
    right: target > player.x + 16,
    jump: near && ball.y < player.y - 84 && ball.vy > -160,
    shoot: near && ball.y > player.y - 104 && ball.x < player.x + 20,
  };
}

function resetKickoff(game: Match) {
  for (const player of game.players) {
    Object.assign(player, {
      x: player.side === 0 ? 260 : 740, y: FLOOR, vx: 0, vy: 0,
      kickTime: 0, kickCooldown: 0, kickHit: false, jumpHeld: false,
    });
  }
  Object.assign(game.ball, { x: WIDTH / 2, y: FLOOR - BALL_RADIUS, vx: 0, vy: 0 });
  game.phase = "playing";
  game.scorer = null;
}

function collideCircle(game: Match, x: number, y: number, radius: number, vx = 0, vy = 0) {
  const ball = game.ball;
  const dx = ball.x - x;
  const dy = ball.y - y;
  const distance = Math.hypot(dx, dy);
  const overlap = radius + BALL_RADIUS - distance;
  if (overlap <= 0) return;
  const nx = distance > 0.001 ? dx / distance : 1;
  const ny = distance > 0.001 ? dy / distance : 0;
  ball.x += nx * overlap;
  ball.y += ny * overlap;
  const toward = (ball.vx - vx) * nx + (ball.vy - vy) * ny;
  if (toward < 0) {
    ball.vx -= 1.65 * toward * nx;
    ball.vy -= 1.65 * toward * ny;
  }
}

function collideGoalFrame(game: Match, x1: number, y1: number, x2: number, y2: number, dt: number) {
  const ball = game.ball;
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const along = clamp(((ball.x - x1) * (x2 - x1) + (ball.y - y1) * (y2 - y1)) / lengthSquared, 0, 1);
  const dx = ball.x - (x1 + along * (x2 - x1));
  const dy = ball.y - (y1 + along * (y2 - y1));
  const distance = Math.hypot(dx, dy);
  const radius = BALL_RADIUS + GOAL_FRAME_RADIUS;
  if (distance >= radius) return;
  const nx = distance > 0.001 ? dx / distance : 0;
  const ny = distance > 0.001 ? dy / distance : -1;
  ball.x += nx * (radius - distance);
  ball.y += ny * (radius - distance);
  const approach = ball.vx * nx + ball.vy * ny;
  if (approach < 0) {
    // Small downward impacts settle on the roof instead of bouncing forever.
    const bounce = ny < -0.9 && -approach < 75 ? 0 : 0.7;
    ball.vx -= (1 + bounce) * approach * nx;
    ball.vy -= (1 + bounce) * approach * ny;
  }
  if (ny < -0.9) {
    ball.vx *= Math.exp(-1.2 * dt);
    if (Math.abs(ball.vx) < 0.8) ball.vx = 0;
  }
}

export function stepMatch(game: Match, inputs: [Controls, Controls], dt: number, mode: GameMode) {
  if (game.phase === "finished") return;
  if (game.phase === "goal") {
    game.goalDelay -= dt;
    if (game.goalDelay <= 0) resetKickoff(game);
    return;
  }
  game.seconds = Math.max(0, game.seconds - dt);
  if (game.seconds === 0) { game.phase = "finished"; return; }

  const ball = game.ball;
  const previousBallX = ball.x;
  for (const player of game.players) {
    const control = mode === "solo" && player.side === 1 ? cpuControls(game) : inputs[player.side];
    const speed = mode === "solo" && player.side === 1 ? 250 : 305;
    player.vx = (Number(control.right) - Number(control.left)) * speed;
    player.x = clamp(player.x + player.vx * dt, GOAL_LINE + 25, WIDTH - GOAL_LINE - 25);
    if (control.jump && !player.jumpHeld && player.y >= FLOOR - 0.1) player.vy = -570;
    player.jumpHeld = control.jump;
    player.vy += 1450 * dt;
    player.y = Math.min(FLOOR, player.y + player.vy * dt);
    if (player.y === FLOOR) player.vy = 0;
    player.kickCooldown = Math.max(0, player.kickCooldown - dt);
    player.kickTime = Math.max(0, player.kickTime - dt);
    // Every press starts the leg animation, even when the ball is out of reach.
    if (control.shoot && player.kickCooldown === 0) {
      player.kickTime = KICK_DURATION;
      player.kickCooldown = 0.4;
      player.kickHit = false;
    }
  }

  const [first, second] = game.players;
  const gap = second.x - first.x;
  if (Math.abs(gap) < 42 && Math.abs(first.y - second.y) < 62) {
    const push = (42 - Math.abs(gap)) / 2;
    const direction = gap < 0 ? -1 : 1;
    first.x = clamp(first.x - direction * push, GOAL_LINE + 25, WIDTH - GOAL_LINE - 25);
    second.x = clamp(second.x + direction * push, GOAL_LINE + 25, WIDTH - GOAL_LINE - 25);
  }

  ball.vy += 1050 * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.spin += ball.vx * dt / BALL_RADIUS;
  ball.vx *= Math.exp(-0.22 * dt);

  for (const player of game.players) {
    const facing = player.side === 0 ? 1 : -1;
    const front = (ball.x - player.x) * facing;
    const foot = footPosition(player);
    const inSwing = Math.hypot(ball.x - foot.x, ball.y - foot.y) < 42;
    const inReach = front > -8 && front < 80 && ball.y > player.y - 76 && ball.y < player.y + 12;
    if (player.kickTime > 0.06 && !player.kickHit && (inSwing || inReach)) {
      ball.vx = facing * (710 + Math.abs(player.vx) * 0.24);
      ball.vy = player.y < FLOOR - 10 ? -380 : -300;
      ball.x = player.x + facing * 63;
      ball.y = Math.min(ball.y, player.y - 23);
      player.kickHit = true;
    } else {
      collideCircle(game, player.x, player.y - 78, 35, player.vx, player.vy);
      collideCircle(game, player.x, player.y - 33, 21, player.vx, player.vy);
      collideCircle(game, foot.x, foot.y, 12, player.vx, player.vy);
    }
  }

  // Both roofs and their rear supports are solid segments with rounded ends.
  // The open front stays passable so shots can enter beneath the crossbar.
  collideGoalFrame(game, GOAL_BACK, GOAL_TOP, GOAL_LINE, GOAL_TOP, dt);
  collideGoalFrame(game, WIDTH - GOAL_LINE, GOAL_TOP, WIDTH - GOAL_BACK, GOAL_TOP, dt);
  collideGoalFrame(game, GOAL_BACK, GOAL_TOP, GOAL_BACK, FLOOR, dt);
  collideGoalFrame(game, WIDTH - GOAL_BACK, GOAL_TOP, WIDTH - GOAL_BACK, FLOOR, dt);
  if (ball.y + BALL_RADIUS > FLOOR) {
    ball.y = FLOOR - BALL_RADIUS;
    ball.vy = Math.abs(ball.vy) < 65 ? 0 : -Math.abs(ball.vy) * 0.69;
    ball.vx *= Math.exp(-0.8 * dt);
  }
  if (ball.y - BALL_RADIUS < 145) { ball.y = 145 + BALL_RADIUS; ball.vy = Math.abs(ball.vy) * 0.7; }
  if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * 0.75; }
  if (ball.x > WIDTH - BALL_RADIUS) { ball.x = WIDTH - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * 0.75; }
  const crossedLeft = previousBallX + BALL_RADIUS >= GOAL_LINE && ball.x + BALL_RADIUS < GOAL_LINE;
  const crossedRight = previousBallX - BALL_RADIUS <= WIDTH - GOAL_LINE && ball.x - BALL_RADIUS > WIDTH - GOAL_LINE;
  if (ball.y - BALL_RADIUS > GOAL_TOP + GOAL_FRAME_RADIUS && (crossedLeft || crossedRight)) {
    const scorer = crossedLeft ? 1 : 0;
    game.score[scorer]++;
    game.scorer = scorer;
    game.phase = "goal";
    game.goalDelay = 1.1;
  }
}
