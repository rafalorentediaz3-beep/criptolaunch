// Run the actual game page in memory when local Next tooling is unavailable.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const postcss = require("postcss");
const tailwind = require("tailwindcss");
const sources = await Promise.all(["app/page.tsx", "components/BigHeadSoccer.tsx"].map((path) => readFile(path, "utf8")));
const bundle = await esbuild.build({
  absWorkingDir: process.cwd(),
  stdin: {
    contents: 'import React from "react"; import { createRoot } from "react-dom/client"; import HomePage from "./app/page"; createRoot(document.getElementById("root")).render(<HomePage />);',
    loader: "tsx", resolveDir: process.cwd(),
  },
  bundle: true, write: false, format: "iife", jsx: "automatic",
  alias: { "@": process.cwd() },
  define: { "process.env.NODE_ENV": '"development"' },
});
const css = await postcss([tailwind({ content: sources.map((raw) => ({ raw, extension: "tsx" })), theme: { extend: {} } })])
  .process("@tailwind base; @tailwind utilities; body { background: #0b121a; color: white; padding: 16px; }", { from: undefined });
createServer((request, response) => {
  if (request.url === "/game.js") { response.setHeader("Content-Type", "application/javascript"); response.end(bundle.outputFiles[0].contents); }
  else if (request.url === "/game.css") { response.setHeader("Content-Type", "text/css"); response.end(css.css); }
  else { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/game.css"></head><body><div id="root"></div><script src="/game.js"></script></body></html>'); }
}).listen(3107, "127.0.0.1", () => console.log("Game component preview ready: http://127.0.0.1:3107"));
