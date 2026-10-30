import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { crawlerFiles, canonicalOrigin } from "./src/lib/crawler-files.ts";
import { metadata, metadataMarkup } from "./src/lib/metadata.ts";
import { validateContent } from "./src/lib/content-schema.ts";

const content = validateContent(
  JSON.parse(
    await readFile(
      new URL("./src/lib/portfolio.json", import.meta.url),
      "utf8",
    ),
  ),
);
const files = crawlerFiles(content);

test("robots permits the portfolio and assets, limits API crawling, and points to the canonical sitemap", () => {
  assert.equal((files["robots.txt"].match(/^User-agent:/gm) || []).length, 1);
  assert.match(
    files["robots.txt"],
    /User-agent: \*\nAllow: \/\nDisallow: \/api\//,
  );
  assert.match(
    files["robots.txt"],
    new RegExp(`Sitemap: ${canonicalOrigin}/sitemap.xml`),
  );
  // Let crawlers see the admin page's noindex directive instead of hiding it in robots.
  assert.ok(!files["robots.txt"].includes("Disallow: /admin"));
});
test("sitemap contains only the one canonical public HTML page", () => {
  assert.deepEqual(
    [...files["sitemap.xml"].matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]),
    [`${canonicalOrigin}/`],
  );
  assert.ok(!files["sitemap.xml"].includes("lastmod"));
  assert.ok(!files["sitemap.xml"].includes("#"));
});
test("llms summary and singular alias contain current visible facts and real links", () => {
  assert.equal(files["llms.txt"], files["llm.txt"]);
  assert.ok(files["llms.txt"].startsWith(`# ${content.profile.name}\n\n> `));
  for (const value of [
    content.profile.email,
    content.profile.role,
    ...content.projects.map((p) => p.title),
    ...content.experience.map((e) => e.company),
  ])
    assert.ok(files["llms.txt"].includes(value));
  for (const privateValue of [
    "/admin",
    "/api/",
    "ADMIN_PASSWORD",
    "GITHUB_CONTENT_TOKEN",
    ".env",
    "src/lib/",
  ])
    assert.ok(!files["llms.txt"].includes(privateValue));
  const links = [...files["llms.txt"].matchAll(/\]\(<([^>]+)>\)/g)].map(
    (m) => new URL(m[1]),
  );
  assert.ok(links.length >= content.projects.length);
  assert.ok(links.every((url) => url.protocol === "https:"));
});
test("metadata and AI summary follow edits to the same content source", () => {
  const next = structuredClone(content);
  next.profile.name = "Updated Profile";
  next.seo.title = "Updated page title";
  next.projects[0].title = "Updated project";
  const data = metadata(next);
  const generated = crawlerFiles(next);
  assert.equal(data.title, "Updated page title");
  assert.equal(data.graph["@graph"][0].name, "Updated Profile");
  assert.ok(generated["llms.txt"].includes("Updated project"));
  assert.ok(generated["llms.txt"].startsWith("# Updated Profile"));
});
test("project schema describes visible works and connects to the profile", () => {
  const data = metadata(content);
  const graph = data.graph["@graph"];
  const projects = graph.filter((n) => n["@type"] === "CreativeWork");
  assert.equal(projects.length, content.projects.length);
  assert.equal(new Set(graph.map((n) => n["@id"])).size, graph.length);
  projects.forEach((p, i) => {
    assert.equal(p.name, content.projects[i].title);
    assert.equal(p.description, content.projects[i].description);
    assert.equal(p.creator["@id"], `${canonicalOrigin}/#person`);
    assert.equal(
      p["@id"],
      `${canonicalOrigin}/#work-${content.projects[i].id}`,
    );
  });
  assert.equal(
    graph.find((n) => n["@type"] === "ProfilePage").mainEntity["@id"],
    `${canonicalOrigin}/#person`,
  );
});
test("metadata safely serializes content that contains HTML-like text", () => {
  const next = structuredClone(content);
  next.profile.name = "Name </script><script>alert(1)</script>";
  next.seo.title = 'Title <test> & "quotes"';
  const markup = metadataMarkup(next);
  assert.ok(!markup.includes("</script><script>"));
  assert.ok(markup.includes("&lt;test&gt; &amp; &quot;quotes&quot;"));
  const graph = JSON.parse(
    markup.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )[1],
  );
  assert.equal(graph["@graph"][0].name, next.profile.name);
});
test("public and production crawler files are generated from current content", async () => {
  for (const [name, body] of Object.entries(files)) {
    assert.equal(
      await readFile(new URL(`./public/${name}`, import.meta.url), "utf8"),
      body,
    );
    assert.equal(
      await readFile(new URL(`./dist/${name}`, import.meta.url), "utf8"),
      body,
    );
  }
});
test("production HTML has crawlable content, one canonical and matching schema", async () => {
  const html = await readFile(
    new URL("./dist/index.html", import.meta.url),
    "utf8",
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="${canonicalOrigin}/"`));
  assert.equal((html.match(/type="application\/ld\+json"/g) || []).length, 1);
  assert.deepEqual(
    JSON.parse(
      html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )[1],
    ),
    metadata(content).graph,
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const project of content.projects)
    assert.ok(ids.includes(`work-${project.id}`));
  for (const entry of content.experience)
    assert.ok(html.includes(entry.company));
  assert.ok(html.includes(content.profile.email));
  assert.ok(html.includes('rel="describedby"'));
});
test("admin and error documents are noindex and absent from sitemap", async () => {
  const admin = await readFile(
    new URL("./dist/admin/index.html", import.meta.url),
    "utf8",
  );
  const error = await readFile(
    new URL("./dist/404.html", import.meta.url),
    "utf8",
  );
  for (const html of [admin, error])
    assert.match(html, /<meta\b[^>]*name="robots"[^>]*content="noindex/);
  assert.ok(!admin.includes('rel="canonical"'));
  assert.ok(!admin.includes('type="application/ld+json"'));
  for (const forbidden of ["/admin", "/404", "/api/", "llms.txt", "llm.txt"])
    assert.ok(!files["sitemap.xml"].includes(forbidden));
});
