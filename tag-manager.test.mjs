import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { readFile } from "node:fs/promises";
import { loadEnv } from "vite";
import {
  injectTagManager,
  stripTagManager,
  resolveTagManagerId,
} from "./src/lib/tag-manager.ts";
const tagManagerId = "GTM-TEST1234";

const template =
  '<!doctype html><html><head><meta charset="UTF-8" /><title>Portfolio</title></head><body><main>Profile</main></body></html>';
function run({
  hostname = "adeshgupta.site",
  pathname = "/",
  search = "",
  framed = false,
} = {}) {
  const scripts = [];
  const window = { location: { hostname, pathname, search } };
  window.self = window;
  window.top = framed ? {} : window;
  const document = {
    getElementsByTagName: () => [
      { parentNode: { insertBefore: (node) => scripts.push(node) } },
    ],
    createElement: () => ({}),
  };
  const code = injectTagManager(template, tagManagerId).match(
    /<script data-portfolio-gtm>([\s\S]*?)<\/script>/,
  )[1];
  const execute = () =>
    runInNewContext(code, { window, document, URLSearchParams });
  execute();
  return { window, scripts, execute };
}
test("public container loads asynchronously once with Google's bootstrap event", () => {
  const { window, scripts, execute } = run();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].async, true);
  assert.equal(
    scripts[0].src,
    `https://www.googletagmanager.com/gtm.js?id=${tagManagerId}`,
  );
  assert.equal(window.dataLayer[0].event, "gtm.js");
  assert.equal(typeof window.dataLayer[0]["gtm.start"], "number");
  execute();
  assert.equal(scripts.length, 1);
  assert.equal(window.dataLayer.length, 1);
  assert.equal(run({ hostname: "www.adeshgupta.site" }).scripts.length, 1);
});
test("admin, draft previews, framed pages, localhost and staging do not load the container", () => {
  for (const page of [
    { pathname: "/admin" },
    { pathname: "/admin/" },
    { pathname: "/api/admin" },
    { search: "?admin-preview=1" },
    { framed: true },
    { hostname: "localhost" },
    { hostname: "preview.vercel.app" },
  ]) {
    const { window, scripts } = run(page);
    assert.equal(scripts.length, 0);
    assert.equal(window.dataLayer, undefined);
  }
});
test("installation puts the loader high in head and fallback first in body without duplication", () => {
  const html = injectTagManager(
    injectTagManager(template, tagManagerId),
    tagManagerId,
  );
  assert.equal((html.match(/<script data-portfolio-gtm>/g) || []).length, 1);
  assert.equal((html.match(/<noscript data-portfolio-gtm>/g) || []).length, 1);
  assert.ok(
    html.indexOf('charset="UTF-8"') <
      html.indexOf("<script data-portfolio-gtm>"),
  );
  assert.ok(
    html.indexOf("<script data-portfolio-gtm>") < html.indexOf("<title>"),
  );
  assert.match(html, /<body>\s*<noscript data-portfolio-gtm>/);
  assert.ok(html.includes(`ns.html?id=${tagManagerId}`));
  assert.equal(stripTagManager(html).includes("googletagmanager.com"), false);
});
test("blank configuration disables tracking and malformed IDs are rejected", () => {
  assert.equal(resolveTagManagerId(undefined), "");
  assert.equal(injectTagManager(template), template);
  assert.equal(
    stripTagManager(injectTagManager(template, tagManagerId)),
    injectTagManager(injectTagManager(template, tagManagerId), ""),
  );
  assert.equal(resolveTagManagerId(`  ${tagManagerId}  `), tagManagerId);
  for (const invalid of [
    "G-ABC1234",
    "<script>alert(1)</script>",
    "GTM-abc1234",
  ])
    assert.throws(() => injectTagManager(template, invalid), /VITE_GTM_ID/);
});
test("production homepage follows the build environment while admin and error pages contain no tracking", async () => {
  const env = loadEnv("production", process.cwd(), "VITE_GTM_ID");
  const configuredId = resolveTagManagerId(
    process.env.VITE_GTM_ID ?? env.VITE_GTM_ID,
  );
  const homepage = await readFile(
    new URL("./dist/index.html", import.meta.url),
    "utf8",
  );
  assert.equal(homepage.includes(`gtm.js`), Boolean(configuredId));
  if (configuredId) assert.ok(homepage.includes(configuredId));
  assert.equal(
    (homepage.match(/<script data-portfolio-gtm>/g) || []).length,
    configuredId ? 1 : 0,
  );
  assert.equal(
    (homepage.match(/<noscript data-portfolio-gtm>/g) || []).length,
    configuredId ? 1 : 0,
  );
  for (const page of ["admin/index.html", "404.html"]) {
    const html = await readFile(
      new URL(`./dist/${page}`, import.meta.url),
      "utf8",
    );
    assert.ok(!html.includes("googletagmanager.com"));
    assert.ok(!html.includes("data-portfolio-gtm"));
  }
});
