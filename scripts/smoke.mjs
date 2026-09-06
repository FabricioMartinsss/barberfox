import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3000";
const page = await fetch(new URL("/", base));
assert.equal(page.status, 200, "A página deve responder HTTP 200");
const html = await page.text();
assert.match(html, /Barberfox/);
assert.match(html, /lang="pt-BR"/);
const cssPaths = [...html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map((match) => match[1]);
assert.ok(cssPaths.length > 0, "A página deve carregar CSS");
for (const path of cssPaths) {
  const css = await fetch(new URL(path.replaceAll("&amp;", "&"), base));
  assert.equal(css.status, 200, "O CSS deve estar disponível");
  assert.match(await css.text(), /border-orange-500/, "Tailwind deve gerar as classes utilizadas");
}
const health = await fetch(new URL("/api/health", base));
assert.equal(health.status, 200);
assert.match(health.headers.get("cache-control") ?? "", /no-store/);
const data = await health.json();
assert.equal(data.status, "ok");
assert.equal(data.application, "barberfox");
assert.equal(data.stage, 0);
assert.ok(Math.abs(Date.now() - Date.parse(data.timestamp)) < 60_000, "O endpoint deve executar no servidor");
const missing = await fetch(new URL("/pagina-inexistente-etapa-zero", base));
assert.equal(missing.status, 404);
console.log(`Smoke OK: página, CSS Tailwind, endpoint dinâmico e 404 em ${base}`);
