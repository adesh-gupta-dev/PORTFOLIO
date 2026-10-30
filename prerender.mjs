import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server";

// Render the same React components into the production document, so profile
// content and links are available to crawlers and visitors without JavaScript.
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const { defaultContent } = await server.ssrLoadModule(
    "/src/lib/portfolio-context.tsx",
  );
  const { metadataMarkup } = await server.ssrLoadModule("/src/lib/metadata.ts");
  const { stripTagManager } = await server.ssrLoadModule(
    "/src/lib/tag-manager.ts",
  );
  const { crawlerFiles } = await server.ssrLoadModule(
    "/src/lib/crawler-files.ts",
  );
  for (const [name, body] of Object.entries(crawlerFiles(defaultContent))) {
    // Keep checked-in public snapshots and deployed output in sync with edits.
    await writeFile(new URL(`./public/${name}`, import.meta.url), body);
    await writeFile(new URL(`./dist/${name}`, import.meta.url), body);
  }
  const html = await readFile(
    new URL("./dist/index.html", import.meta.url),
    "utf8",
  );
  if (!html.includes('<div id="root"></div>'))
    throw new Error("Prerender root was not found");
  // Keep font loading, verification, theme initialization and Vite asset tags,
  // then regenerate factual metadata from the exact same content as the page.
  const shell = html
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/g, "")
    .replace(/<link\b[^>]*rel="describedby"[^>]*>/g, "")
    .replace(
      /<meta\b(?=[^>]*(?:name="(?:description|author|twitter:[^"]+)"|property="og:[^"]+"))[^>]*>/g,
      "",
    )
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const homepage = shell.replace(
    "</head>",
    `${metadataMarkup(defaultContent)}\n</head>`,
  );
  await writeFile(
    new URL("./dist/index.html", import.meta.url),
    homepage.replace(
      '<div id="root"></div>',
      () => `<div id="root">${renderToString(React.createElement(App))}</div>`,
    ),
  );
  await mkdir(new URL("./dist/admin/", import.meta.url), { recursive: true });
  const adminShell = stripTagManager(shell)
    .replace(/<meta\b[^>]*name="robots"[^>]*>/g, "")
    .replace(
      "</head>",
      '<title>Portfolio Admin | Content Editor</title><meta name="robots" content="noindex, nofollow" /></head>',
    );
  await writeFile(
    new URL("./dist/admin/index.html", import.meta.url),
    adminShell,
  );
  console.log(
    "Prerendered homepage with crawlable profile, experience, and projects.",
  );
} finally {
  await server.close();
}
