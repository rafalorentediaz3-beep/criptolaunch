// Run against a local Next server and a fresh Chrome profile with CDP enabled.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const url = process.env.SOCCER_CHECK_URL || "http://127.0.0.1:3107";
const debugging = process.env.SOCCER_CHECK_CDP || "http://127.0.0.1:9227";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pages = await (await fetch(`${debugging}/json`)).json();
const socket = new WebSocket(pages.find((page) => page.type === "page").webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const requests = new Map();
const errors = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  const pending = requests.get(message.id);
  if (pending) {
    requests.delete(message.id);
    clearTimeout(pending.timer);
    if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { requests.delete(id); reject(new Error(`Timed out: ${method}`)); }, 60000);
  requests.set(id, { resolve, reject, timer });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression) => {
  for (let attempt = 0; attempt < 160; attempt++) { if (await evaluate(expression)) return; await delay(500); }
  throw new Error(`Page condition failed: ${expression}`);
};
const key = (type, code, value) => send("Input.dispatchKeyEvent", { type, code, key: value });
const pixels = (region) => evaluate(`(() => {
  const canvas = document.querySelector('canvas');
  const data = canvas.getContext('2d').getImageData(${region.join(",")}).data;
  let hash = 2166136261;
  for (const byte of data) hash = Math.imul(hash ^ byte, 16777619);
  return hash >>> 0;
})()`);
const kitCenter = (red, green, blue) => evaluate(`(() => {
  const data = document.querySelector('canvas').getContext('2d').getImageData(0, 370, 1000, 25).data;
  let sum = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === ${red} && data[i+1] === ${green} && data[i+2] === ${blue}) { sum += (i / 4) % 1000; count++; }
  }
  if (!count) throw new Error('Player kit not visible');
  return sum / count;
})()`);
const ballCenter = () => evaluate(`(() => {
  const data = document.querySelector('canvas').getContext('2d').getImageData(0, 200, 1000, 230).data;
  let x = 0, y = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 24 && data[i+1] === 36 && data[i+2] === 49) {
      x += (i / 4) % 1000; y += Math.floor(i / 4 / 1000) + 200; count++;
    }
  }
  if (!count) throw new Error('Ball not visible');
  return {x:x/count,y:y/count};
})()`);

try {
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await waitFor("[...document.querySelectorAll('button')].some(b => b.textContent === 'Jugar ahora')");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Jugar ahora').click()");
  await waitFor("document.body.textContent.includes('Partido en curso')");
  await delay(200);
  const footBefore = await pixels([260, 355, 70, 65]);
  await key("keyDown", "KeyF", "f"); await delay(65); await key("keyUp", "KeyF", "f"); await delay(35);
  assert.notEqual(await pixels([260, 355, 70, 65]), footBefore, "Shooting must animate the foot in the actual canvas");
  console.log("PASS: Jugar starts the match; F visibly animates the foot");

  const before = await kitCenter(168, 242, 108);
  await key("keyDown", "KeyD", "d"); await delay(350); await key("keyUp", "KeyD", "d"); await delay(30);
  const after = await kitCenter(168, 242, 108);
  assert.ok(after > before + 50, "Keyboard input must move the local player");
  console.log("PASS: keyboard movement updates the rendered player");

  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Pausar').click()");
  await waitFor("document.body.textContent.includes('Partido en pausa')");
  await delay(80);
  const paused = await pixels([0, 0, 1000, 480]); await delay(200);
  assert.equal(await pixels([0, 0, 1000, 480]), paused, "Pause must freeze the match");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Continuar').click()");
  console.log("PASS: pause freezes the simulation and Continue resumes");

  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Dos jugadores')).click()");
  await waitFor("[...document.querySelectorAll('button')].some(b => b.textContent === 'Jugar ahora')");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Jugar ahora').click()");
  await delay(100);
  const visitorBefore = await kitCenter(112, 207, 255);
  await key("keyDown", "ArrowLeft", "ArrowLeft"); await delay(300); await key("keyUp", "ArrowLeft", "ArrowLeft");
  assert.ok(await kitCenter(112, 207, 255) < visitorBefore - 40, "The second player must move independently");
  console.log("PASS: second player responds to arrow keys in local mode");

  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Revancha').click()");
  await delay(100);
  await key("keyDown", "KeyD", "d"); await delay(550); await key("keyUp", "KeyD", "d");
  const ballBefore = await ballCenter();
  await key("keyDown", "KeyF", "f"); await delay(30); await key("keyUp", "KeyF", "f"); await delay(90);
  const ballAfter = await ballCenter();
  assert.ok(ballAfter.x > ballBefore.x + 40 && ballAfter.y < ballBefore.y - 5, 'The rendered ball must travel toward goal after shooting');
  console.log("PASS: approaching the ball and pressing F visibly shoots it toward goal");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent === 'Revancha').click()");
  await delay(80);

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const box = await evaluate("(() => { const b = document.querySelector('[aria-label=\"Lima FC: tirar\"]'); b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()");
  await delay(100);
  // After switching to local mode the left player is back at the kickoff position.
  const tapBefore = await pixels([260, 355, 70, 65]);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...box, button: "left", clickCount: 1 });
  await delay(12);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...box, button: "left", clickCount: 1 });
  await delay(80);
  assert.notEqual(await pixels([260, 355, 70, 65]), tapBefore, "A short on-screen tap must animate the kick");
  console.log("PASS: mobile layout and a short on-screen TIRO tap work");

  const png = await evaluate("document.querySelector('canvas').toDataURL('image/png').split(',')[1]");
  const imagePath = join(tmpdir(), "cabezones-game-preview.png");
  await writeFile(imagePath, Buffer.from(png, "base64"));
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(', ')}`);
  console.log(`PASS: no browser exceptions; screenshot: ${imagePath}`);
} finally { socket.close(); }
