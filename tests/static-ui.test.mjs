import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

test("application shell exposes semantic global navigation", async () => {
  const html = await read("index.html");
  assert.match(html, /href="\.\/styles\.css\?v=20260713-5"/);
  assert.match(html, /<nav[^>]+aria-label="全局导航"/);
  assert.match(html, /href="#\/conversation"/);
  assert.match(html, /href="#\/scenes"/);
  assert.match(html, /href="#\/review"/);
  assert.match(html, /href="#\/profile\/overview"/);
  assert.match(html, /<main[^>]+id="app-root"/);
});

test("source contains all routes and excludes banned product patterns", async () => {
  const files = [
    "index.html",
    "src/app.mjs",
    "src/views/conversation.mjs",
    "src/views/scenes.mjs",
    "src/views/training.mjs",
    "src/views/review.mjs",
    "src/views/profile.mjs",
  ];
  const source = (await Promise.all(files.map(read))).join("\n");
  for (const route of [
    "#/conversation", "#/scenes", "#/review", "#/review/cafe",
    "#/training/cafe/words", "#/training/cafe/sentences",
    "#/training/cafe/simulation",
    "#/profile/overview", "#/profile/assets", "#/profile/scenes", "#/profile/settings",
  ]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));

  for (const banned of ["排名", "连续打卡", "勋章", "爱心", "重新模拟", "整场复练"])
    assert.equal(source.includes(banned), false, `unexpected banned copy: ${banned}`);
});

test("simulation ends with an in-context radar score modal", async () => {
  const training = await read("src/views/training.mjs");
  assert.match(training, /score-modal/);
  assert.match(training, /radar-chart/);
  assert.match(training, /返回场景广场/);
  assert.match(training, /查看学习资产/);
});

test("training controls follow the simplified three-stage interaction", async () => {
  const training = await read("src/views/training.mjs");
  assert.match(training, /word-audio-btn/);
  assert.equal(training.includes("听原声示范"), false);
  assert.equal(training.includes("跟读这个表达"), false);
  assert.match(training, />上一步<\/a>/);
  assert.match(training, /sentence-record is-centered/);
  assert.match(training, /simulation-voice is-centered/);
  assert.match(training, />结束模拟<\/button>/);
  assert.equal(training.includes("simulation-brief"), false);
  assert.match(training, /选择饮品和杯型/);
  assert.match(training, /sentence-list training-sidebar/);
  assert.match(training, /asset-queue training-sidebar/);
});

test("stylesheet contains the approved quality floor", async () => {
  const css = await read("styles.css");
  for (const token of ["--bg:#faf9f5", "--ink:#20211e", "--accent:#e8462d", "--blue:#1e7fbf"])
    assert.equal(css.toLowerCase().replaceAll(" ", "").includes(token), true, `missing ${token}`);
  assert.match(css, /:focus-visible/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /min-height:\s*44px/);
});

test("desktop directory pages reserve enough space to avoid internal page drift", async () => {
  const css = await read("styles.css");
  assert.match(css, /\.scene-layout\{height:calc\(100% - 107px\)/);
  assert.match(css, /\.review-overview\{height:calc\(100% - 107px\)/);
  assert.match(css, /\.review-detail-layout\{height:calc\(100% - 275px\)/);
});

test("settings ranges provide explicit keyboard controls", async () => {
  const app = await read("src/app.mjs");
  assert.match(app, /addEventListener\("keydown"/);
  for (const key of ["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"])
    assert.equal(app.includes(`"${key}"`), true, `missing keyboard key: ${key}`);
  assert.match(app, /event\.preventDefault\(\)/);
});

test("brand cell is opaque so mobile sticky-header capture stays stable", async () => {
  const css = await read("styles.css");
  assert.match(css, /\.brand\{[^}]*background:var\(--nav\)/);
});

test("mobile controls use 44px hit areas without enlarging switch tracks", async () => {
  const css = await read("styles.css");
  assert.match(css, /--tap:44px/);
  assert.match(css, /\.history-table \.icon-action\{width:var\(--tap\);height:var\(--tap\);min-height:var\(--tap\)/);
  assert.match(css, /\.switch\{width:48px;height:var\(--tap\);min-height:var\(--tap\);background:transparent\}/);
  assert.match(css, /\.switch:before\{/);
});
