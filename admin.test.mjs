import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adminHandler } from "./src/lib/admin-server.ts";
import { validateContent } from "./src/lib/content-schema.ts";

test("admin API authenticates, validates, persists and rejects unsafe writes", async (t) => {
  const keys = [
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
    "ADMIN_ORIGIN",
    "GITHUB_CONTENT_TOKEN",
    "GITHUB_REPOSITORY",
    "GITHUB_BRANCH",
    "NODE_ENV",
    "VERCEL",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const password = randomBytes(24).toString("hex");
  Object.assign(process.env, {
    ADMIN_USERNAME: "test-owner",
    ADMIN_PASSWORD: password,
    ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
    ADMIN_ORIGIN: "https://adeshgupta.site",
    GITHUB_CONTENT_TOKEN: "test-only-token",
    GITHUB_REPOSITORY: "test-owner/portfolio",
    GITHUB_BRANCH: "main",
    NODE_ENV: "test",
    VERCEL: "0",
  });
  let content = JSON.parse(
    await readFile(
      new URL("./src/lib/portfolio.json", import.meta.url),
      "utf8",
    ),
  );
  let sha = "a".repeat(40);
  let upstreamFailure = false;
  let writeFailureStatus = 0;
  let writes = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (!String(url).startsWith("https://api.github.com/"))
      return originalFetch(url, options);
    assert.equal(options.headers.Authorization, "Bearer test-only-token");
    if (upstreamFailure)
      return Response.json(
        { message: "sensitive upstream response" },
        { status: 403 },
      );
    if (options.method === "PUT") {
      if (writeFailureStatus)
        return Response.json(
          { message: "sensitive upstream response test-only-token" },
          { status: writeFailureStatus },
        );
      const body = JSON.parse(options.body);
      assert.equal(body.sha, sha);
      assert.equal(body.branch, "main");
      content = JSON.parse(
        Buffer.from(body.content, "base64").toString("utf8"),
      );
      sha = createHash("sha1").update(body.content).digest("hex");
      writes++;
      return Response.json({ content: { sha } });
    }
    return Response.json({
      type: "file",
      encoding: "base64",
      sha,
      size: JSON.stringify(content).length,
      content: Buffer.from(JSON.stringify(content)).toString("base64"),
    });
  };
  const server = createServer(adminHandler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const send = (
    action,
    {
      body,
      cookie,
      csrf,
      site = "https://adeshgupta.site",
      method = body ? "POST" : "GET",
    } = {},
  ) =>
    originalFetch(`${origin}/api/admin?action=${action}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json", Origin: site } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  let cookie, csrf;
  try {
    await t.test(
      "image fields accept local assets, reject unsafe URLs, and preserve older backups",
      () => {
        const old = structuredClone(content);
        delete old.profile.heroImage;
        delete old.profile.heroImageAlt;
        for (const project of old.projects) {
          delete project.imageUrl;
          delete project.imageAlt;
        }
        const migrated = validateContent(old);
        assert.equal(migrated.profile.heroImage, "/res/electric-core.webp");
        assert.equal(migrated.projects[0].imageUrl, "");
        migrated.projects[0].imageUrl = "/res/kalpriti-preview.webp";
        assert.equal(
          validateContent(migrated).projects[0].imageUrl,
          "/res/kalpriti-preview.webp",
        );
        migrated.projects[0].imageUrl = "javascript:alert(1)";
        assert.throws(() => validateContent(migrated), /HTTPS URL/);
      },
    );
    await t.test(
      "password-length configuration accepts eight characters and rejects shorter values",
      async () => {
        process.env.ADMIN_PASSWORD = "12345678";
        assert.equal((await (await send("session")).json()).configured, true);
        process.env.ADMIN_PASSWORD = "1234567";
        assert.equal((await (await send("session")).json()).configured, false);
        process.env.ADMIN_PASSWORD = password;
      },
    );
    await t.test("configuration fails closed", async () => {
      const secret = process.env.ADMIN_SESSION_SECRET;
      delete process.env.ADMIN_SESSION_SECRET;
      const state = await (await send("session")).json();
      assert.equal(state.configured, false);
      assert.equal(state.authenticated, false);
      assert.equal(
        (await send("login", { body: { username: "test-owner", password } }))
          .status,
        503,
      );
      process.env.ADMIN_SESSION_SECRET = secret;
    });
    await t.test(
      "anonymous access cannot read editor state or save",
      async () => {
        assert.equal((await send("content")).status, 401);
        assert.equal(
          (await send("save", { body: { content, sha } })).status,
          401,
        );
        assert.equal(writes, 0);
        const publicData = await (await send("public")).json();
        assert.equal(publicData.content.profile.name, content.profile.name);
        assert.equal(publicData.sha, undefined);
      },
    );
    await t.test(
      "login checks credentials and uses an HTTP-only session",
      async () => {
        const wrong = await send("login", {
          body: { username: "test-owner", password: "incorrect-password" },
        });
        assert.equal(wrong.status, 401);
        const response = await send("login", {
          body: { username: "test-owner", password },
        });
        assert.equal(response.status, 200);
        const raw = response.headers.get("set-cookie");
        assert.match(raw, /HttpOnly/);
        assert.match(raw, /SameSite=Strict/);
        assert.match(raw, /Path=\//);
        cookie = raw.split(";")[0];
        const data = await response.json();
        csrf = data.csrf;
        assert.equal(data.authenticated, true);
        assert.ok(csrf);
        const state = await (await send("session", { cookie })).json();
        assert.equal(state.username, "test-owner");
        assert.equal(state.csrf, csrf);
      },
    );
    await t.test(
      "cross-site requests and missing CSRF tokens are rejected",
      async () => {
        assert.equal(
          (
            await send("save", {
              body: { content, sha },
              cookie,
              csrf,
              site: "https://attacker.example",
            })
          ).status,
          403,
        );
        assert.equal(
          (await send("save", { body: { content, sha }, cookie })).status,
          403,
        );
        assert.equal(
          (await send("logout", { body: {}, cookie, csrf: "wrong" })).status,
          403,
        );
        assert.equal(writes, 0);
      },
    );
    await t.test(
      "invalid content and dangerous URL schemes cannot be published",
      async () => {
        const invalid = structuredClone(content);
        invalid.profile.resumeUrl = "javascript:alert(1)";
        assert.equal(
          (
            await send("save", {
              body: { content: invalid, sha },
              cookie,
              csrf,
            })
          ).status,
          400,
        );
        invalid.profile.resumeUrl = "https://user:password@example.com/";
        assert.throws(() => validateContent(invalid), /HTTPS URL/);
        invalid.profile.resumeUrl = "";
        invalid.projects[1].id = invalid.projects[0].id;
        assert.throws(() => validateContent(invalid), /unique ID/);
        assert.equal(writes, 0);
      },
    );
    await t.test(
      "save persists all content and public reads see it",
      async () => {
        const next = structuredClone(content);
        next.profile.resumeUrl = "https://example.com/resume.pdf";
        next.skillGroups[0].skills.push("Test skill");
        const response = await send("save", {
          body: { content: next, sha },
          cookie,
          csrf,
        });
        assert.equal(response.status, 200);
        assert.equal(writes, 1);
        const data = await response.json();
        assert.equal(data.sha, sha);
        const read = await (await send("public")).json();
        assert.equal(read.content.profile.resumeUrl, next.profile.resumeUrl);
        assert.ok(read.content.skillGroups[0].skills.includes("Test skill"));
        const authenticated = await (await send("content", { cookie })).json();
        assert.equal(authenticated.sha, sha);
      },
    );
    await t.test(
      "outdated sessions cannot overwrite a newer revision",
      async () => {
        assert.equal(
          (
            await send("save", {
              body: { content, sha: "b".repeat(40) },
              cookie,
              csrf,
            })
          ).status,
          409,
        );
        assert.equal(writes, 1);
      },
    );
    await t.test("failed GitHub writes identify the cause without exposing secrets", async () => {
      try {
        for (const [status, expected] of [
          [401, /expired or revoked/],
          [403, /Contents: read and write/],
          [404, /selected repository/],
          [429, /limited publishing requests/],
          [503, /temporarily unavailable/],
        ]) {
          writeFailureStatus = status;
          const response = await send("save", {
            body: { content, sha }, cookie, csrf,
          });
          assert.equal(response.status, 502);
          const { error } = await response.json();
          assert.match(error, expected);
          assert.ok(error.includes(`GitHub HTTP ${status}`));
          assert.ok(error.includes("draft is kept"));
          assert.ok(!error.includes("test-only-token"));
          assert.ok(!error.includes("sensitive upstream"));
          assert.ok(!error.includes(password));
        }
        assert.equal(writes, 1);
      } finally {
        writeFailureStatus = 0;
      }
    });
    await t.test("upstream failures do not disclose secrets", async () => {
      upstreamFailure = true;
      const response = await send("content", { cookie });
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.ok(!text.includes("test-only-token"));
      assert.ok(!text.includes(password));
      assert.ok(!text.includes("sensitive upstream"));
      upstreamFailure = false;
    });
    await t.test(
      "tampering and credential rotation invalidate sessions",
      async () => {
        assert.equal(
          (await send("content", { cookie: cookie + "tampered" })).status,
          401,
        );
        process.env.ADMIN_PASSWORD = password + "rotated";
        assert.equal((await send("content", { cookie })).status, 401);
        process.env.ADMIN_PASSWORD = password;
      },
    );
    await t.test(
      "logout clears the session and requests use no-store",
      async () => {
        const response = await send("logout", { body: {}, cookie, csrf });
        assert.equal(response.status, 200);
        assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.match(response.headers.get("x-robots-tag"), /noindex/);
      },
    );
    await t.test("repeated sign-in attempts are rate limited", async () => {
      let response;
      for (let i = 0; i < 6; i++)
        response = await send("login", {
          body: { username: "wrong", password: "incorrect-password" },
        });
      assert.equal(response.status, 429);
      assert.equal(response.headers.get("retry-after"), "900");
    });
    await t.test("production sessions require secure cookies", async () => {
      process.env.NODE_ENV = "production";
      // A separate client IP exercises secure mode without the prior rate bucket.
      const response = await originalFetch(`${origin}/api/admin?action=login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://adeshgupta.site",
          "x-vercel-forwarded-for": "192.0.2.10",
        },
        body: JSON.stringify({ username: "test-owner", password }),
      });
      assert.equal(response.status, 200);
      const raw = response.headers.get("set-cookie");
      assert.match(raw, /__Host-portfolio_admin=/);
      assert.match(raw, /; Secure/);
    });
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("local development stores content without GitHub and protects concurrent edits", async () => {
  const keys = [
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
    "ADMIN_ORIGIN",
    "GITHUB_CONTENT_TOKEN",
    "PORTFOLIO_LOCAL_EDITOR",
    "PORTFOLIO_LOCAL_CONTENT_FILE",
    "NODE_ENV",
    "VERCEL",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const directory = await mkdtemp(join(tmpdir(), "portfolio-local-test-"));
  const file = join(directory, "portfolio.json");
  const original = JSON.parse(
    await readFile(
      new URL("./src/lib/portfolio.json", import.meta.url),
      "utf8",
    ),
  );
  await writeFile(file, JSON.stringify(original));
  const password = randomBytes(24).toString("hex");
  Object.assign(process.env, {
    ADMIN_USERNAME: "local-owner",
    ADMIN_PASSWORD: password,
    ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
    ADMIN_ORIGIN: "https://adeshgupta.site",
    GITHUB_CONTENT_TOKEN: "",
    PORTFOLIO_LOCAL_EDITOR: "1",
    PORTFOLIO_LOCAL_CONTENT_FILE: file,
    NODE_ENV: "development",
    VERCEL: "0",
  });
  // Isolate rate-limit buckets from the preceding abuse-throttling scenario.
  const { adminHandler: localHandler } = await import("./src/lib/admin-server.ts?local-store-test");
  const server = createServer(localHandler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const get = (action, cookie) =>
    fetch(`${origin}/api/admin?action=${action}`, {
      headers: cookie ? { Cookie: cookie } : {},
    });
  const post = (action, body, cookie, csrf) =>
    fetch(`${origin}/api/admin?action=${action}`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: JSON.stringify(body),
    });
  try {
    const state = await (await get("session")).json();
    assert.equal(state.storageMode, "local");
    assert.equal(state.storageConfigured, true);
    const login = await post("login", { username: "local-owner", password });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const { csrf } = await login.json();
    const saved = await (await get("content", cookie)).json();
    assert.equal(saved.content.profile.name, original.profile.name);
    const next = structuredClone(saved.content);
    next.profile.footerText = "Local save test";
    const response = await post(
      "save",
      { content: next, sha: saved.sha },
      cookie,
      csrf,
    );
    assert.equal(response.status, 200);
    assert.equal(
      JSON.parse(await readFile(file, "utf8")).profile.footerText,
      "Local save test",
    );
    const publicRead = await get("public");
    assert.equal(publicRead.headers.get("cache-control"), "no-store");
    const current = await (await get("content", cookie)).json();
    const writes = await Promise.all([
      post(
        "save",
        {
          content: {
            ...next,
            profile: { ...next.profile, footerText: "Concurrent A" },
          },
          sha: current.sha,
        },
        cookie,
        csrf,
      ),
      post(
        "save",
        {
          content: {
            ...next,
            profile: { ...next.profile, footerText: "Concurrent B" },
          },
          sha: current.sha,
        },
        cookie,
        csrf,
      ),
    ]);
    assert.deepEqual(
      writes.map((response) => response.status).sort(),
      [200, 409],
    );
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    const production = await (await get("session")).json();
    assert.equal(production.storageMode, "github");
    assert.equal(production.storageConfigured, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    assert.ok(directory.startsWith(join(tmpdir(), "portfolio-local-test-")));
    await rm(directory, { recursive: true, force: true });
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
