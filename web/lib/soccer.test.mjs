import { test } from "node:test";
import assert from "node:assert/strict";
import { createMatch, stepMatch, idleControls, footPosition, kickAngle, FLOOR, GOAL_LINE, GOAL_TOP, GOAL_BACK, GOAL_FRAME_RADIUS, BALL_RADIUS, WIDTH } from "./soccer.ts";

const kit = { name: "Local", color: "#a8f26c", accent: "#365c1e", skin: "#e8b083", hair: "#33241d", hairstyle: "quiff" };
const match = () => createMatch(kit, { ...kit, name: "Visitante" });
const input = (overrides = {}) => ({ ...idleControls(), ...overrides });
const advance = (game, duration, controls = [input(), input()], mode = "local") => {
  for (let i = 0; i < Math.ceil(duration * 120); i++) stepMatch(game, controls, 1 / 120, mode);
};

test("both players move and jump independently", () => {
  const game = match();
  advance(game, 0.2, [input({ right: true, jump: true }), input({ left: true })]);
  assert.ok(game.players[0].x > 300);
  assert.ok(game.players[0].y < FLOOR);
  assert.ok(game.players[1].x < 700);
  assert.equal(game.players[1].y, FLOOR);
});

test("shooting animates the foot even when no ball is nearby", () => {
  const game = match();
  const initial = footPosition(game.players[0]);
  stepMatch(game, [input({ shoot: true }), input()], 1 / 120, "local");
  advance(game, 0.1);
  assert.ok(game.players[0].kickTime > 0);
  assert.ok(kickAngle(game.players[0]) < -0.5);
  assert.ok(footPosition(game.players[0]).y < initial.y - 15);
  advance(game, 0.4);
  assert.equal(game.players[0].kickTime, 0);
});

for (const side of [0, 1]) test(`player ${side + 1} shoots the ball toward the opposing goal`, () => {
  const game = match();
  const direction = side === 0 ? 1 : -1;
  game.ball.x = game.players[side].x + direction * 50;
  game.ball.y = FLOOR - BALL_RADIUS;
  const controls = [input(), input()];
  controls[side].shoot = true;
  stepMatch(game, controls, 1 / 120, "local");
  assert.ok(game.ball.vx * direction > 600);
  assert.ok(game.ball.vy < -250);
  assert.equal(game.players[side].kickHit, true);
});

test("a short shot press keeps animating after release and cannot shoot twice immediately", () => {
  const game = match();
  game.ball.x = game.players[0].x + 50;
  stepMatch(game, [input({ shoot: true }), input()], 1 / 120, "local");
  advance(game, 0.1);
  const remaining = game.players[0].kickTime;
  stepMatch(game, [input({ shoot: true }), input()], 1 / 120, "local");
  assert.ok(game.players[0].kickTime < remaining);
});

test("body contact without shooting does not trigger the kick animation", () => {
  const game = match();
  game.ball.x = game.players[0].x + 25;
  stepMatch(game, [input(), input()], 1 / 120, "local");
  assert.equal(game.players[0].kickTime, 0);
  assert.ok(Math.abs(game.ball.vx) < 600);
});

test("a goal counts once, pauses and resets the kickoff", () => {
  const game = match();
  game.ball.x = GOAL_LINE - BALL_RADIUS + 2;
  game.ball.y = FLOOR - BALL_RADIUS;
  game.ball.vx = -500;
  stepMatch(game, [input(), input()], 1 / 120, "local");
  assert.deepEqual(game.score, [0, 1]);
  assert.equal(game.phase, "goal");
  advance(game, 1.12);
  assert.equal(game.phase, "playing");
  assert.deepEqual(game.score, [0, 1]);
  assert.equal(game.ball.x, 500);
});

for (const left of [true, false]) {
  const side = left ? "left" : "right";
  const mirror = (x) => left ? x : WIDTH - x;
  const direction = left ? 1 : -1;
  const roofY = GOAL_TOP - GOAL_FRAME_RADIUS - BALL_RADIUS;

  test(`${side} goal roof catches a falling ball and lets it settle on top`, () => {
    const game = match();
    game.ball.x = mirror((GOAL_BACK + GOAL_LINE) / 2);
    game.ball.y = roofY - 28;
    game.ball.vy = 180;
    advance(game, 2);
    assert.equal(game.phase, "playing");
    assert.deepEqual(game.score, [0, 0]);
    assert.ok(Math.abs(game.ball.y - roofY) < 0.001);
    assert.equal(game.ball.vy, 0);
  });

  test(`${side} roof supports a rolling ball until it rolls off toward the field`, () => {
    const game = match();
    game.ball.x = mirror((GOAL_BACK + GOAL_LINE) / 2);
    game.ball.y = roofY;
    game.ball.vx = direction * 130;
    advance(game, 0.1);
    assert.ok(game.ball.y <= roofY + 0.001);
    advance(game, 1);
    assert.ok((game.ball.x - mirror(GOAL_LINE)) * direction > BALL_RADIUS);
    assert.ok(game.ball.y > roofY + 10);
    assert.deepEqual(game.score, [0, 0]);
  });

  test(`${side} roof also blocks the ball from below`, () => {
    const game = match();
    game.ball.x = mirror((GOAL_BACK + GOAL_LINE) / 2);
    game.ball.y = GOAL_TOP + GOAL_FRAME_RADIUS + BALL_RADIUS + 4;
    game.ball.vy = -220;
    advance(game, 0.12);
    assert.ok(game.ball.y >= GOAL_TOP + GOAL_FRAME_RADIUS + BALL_RADIUS);
    assert.ok(game.ball.vy > 0);
    assert.deepEqual(game.score, [0, 0]);
  });

  test(`${side} crossbar and rear support bounce the ball`, () => {
    const game = match();
    game.ball.x = mirror(GOAL_LINE + BALL_RADIUS + GOAL_FRAME_RADIUS + 2);
    game.ball.y = GOAL_TOP;
    game.ball.vx = -direction * 180;
    advance(game, 0.08);
    assert.ok(game.ball.vx * direction > 0);
    assert.deepEqual(game.score, [0, 0]);

    game.ball.x = mirror(GOAL_BACK + BALL_RADIUS + GOAL_FRAME_RADIUS + 2);
    game.ball.y = GOAL_TOP + 65;
    game.ball.vx = -direction * 180;
    game.ball.vy = 0;
    advance(game, 0.08);
    assert.ok(game.ball.vx * direction > 0);
    assert.deepEqual(game.score, [0, 0]);
  });

  test(`${side} goal still accepts a shot through the open mouth`, () => {
    const game = match();
    game.ball.x = mirror(GOAL_LINE - BALL_RADIUS + 2);
    game.ball.y = GOAL_TOP + 60;
    game.ball.vx = -direction * 500;
    stepMatch(game, [input(), input()], 1 / 120, "local");
    assert.equal(game.phase, "goal");
    assert.deepEqual(game.score, left ? [0, 1] : [1, 0]);
  });
}

test("CPU pursues the ball without keyboard input", () => {
  const game = match();
  advance(game, 0.5, [input(), input()], "solo");
  assert.ok(game.players[1].x < 650);
});

test("the final whistle freezes the match", () => {
  const game = match();
  game.seconds = 0.001;
  stepMatch(game, [input(), input()], 1 / 120, "local");
  assert.equal(game.phase, "finished");
  const snapshot = JSON.stringify(game);
  advance(game, 1, [input({ right: true, shoot: true }), input({ jump: true })]);
  assert.equal(JSON.stringify(game), snapshot);
});

test("a full simulated match remains finite and produces goals", () => {
  const game = match();
  let steps = 0;
  while (game.phase !== "finished" && steps++ < 25000) {
    const player = game.players[0];
    stepMatch(game, [input({ left: game.ball.x < player.x - 45, right: game.ball.x > player.x + 45, shoot: true }), input()], 1 / 120, "solo");
    assert.ok(Number.isFinite(game.ball.x) && Number.isFinite(game.ball.y));
    assert.ok(game.players.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
  }
  assert.equal(game.phase, "finished");
  assert.ok(game.score[0] + game.score[1] > 0);
});
