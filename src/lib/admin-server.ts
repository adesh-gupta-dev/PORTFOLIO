import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile, writeFile, rename, rm } from "node:fs/promises";
import { isAbsolute } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { validateContent, type PortfolioContent } from "./content-schema.ts";

const derive = promisify(scrypt);
const contentPath = "src/lib/portfolio.json";
const maxBodyBytes = 240_000;
const sessionSeconds = 8 * 60 * 60;
type Request = IncomingMessage & { body?: unknown };
interface Session {
  sub: string;
  exp: number;
  nonce: string;
  version: string;
}
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
function settings() {
  const username = process.env.ADMIN_USERNAME || "";
  const password = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const repository =
    process.env.GITHUB_REPOSITORY || "adesh-gupta-dev/PORTFOLIO";
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_CONTENT_TOKEN || "";
  const localFile = process.env.PORTFOLIO_LOCAL_CONTENT_FILE || "";
  const localEditor =
    process.env.PORTFOLIO_LOCAL_EDITOR === "1" &&
    process.env.VERCEL !== "1" &&
    process.env.NODE_ENV !== "production" &&
    isAbsolute(localFile);
  const production =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const origin = process.env.ADMIN_ORIGIN || "https://adeshgupta.site";
  const configured =
    username.length > 0 &&
    username.length <= 128 &&
    password.length >= 8 &&
    secret.length >= 32;
  const storageConfigured = Boolean(
    localEditor ||
    (token &&
      /^[\w.-]+\/[\w.-]+$/.test(repository) &&
      branch.length <= 200 &&
      !branch.includes("..")),
  );
  return {
    username,
    password,
    secret,
    repository,
    branch,
    token,
    production,
    origin,
    configured,
    storageConfigured,
    localEditor,
    localFile,
    storageMode: localEditor ? "local" : "github",
  };
}
const equal = (a: string, b: string) =>
  timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
const hmac = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");
const credentialVersion = () => {
  const c = settings();
  return hmac(`${c.username}\0${c.password}`, c.secret).slice(0, 24);
};
const cookieName = () =>
  settings().production ? "__Host-portfolio_admin" : "portfolio_admin";
function setCookie(res: ServerResponse, value: string, maxAge: number) {
  res.setHeader(
    "Set-Cookie",
    `${cookieName()}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${settings().production ? "; Secure" : ""}`,
  );
}
function createSession(): { token: string; session: Session } {
  const c = settings();
  const session = {
    sub: c.username,
    exp: Math.floor(Date.now() / 1000) + sessionSeconds,
    nonce: randomBytes(24).toString("base64url"),
    version: credentialVersion(),
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${hmac(payload, c.secret)}`, session };
}
function readSession(req: Request): Session | null {
  const c = settings();
  if (!c.configured) return null;
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${cookieName()}=`));
  const value = cookie?.slice(cookieName().length + 1);
  if (!value || value.length > 2048) return null;
  const [payload, signature, ...extra] = value.split(".");
  if (
    extra.length ||
    !payload ||
    !signature ||
    !equal(signature, hmac(payload, c.secret))
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      data.sub !== c.username ||
      !Number.isInteger(data.exp) ||
      data.exp <= Date.now() / 1000 ||
      data.exp > Date.now() / 1000 + sessionSeconds + 60 ||
      typeof data.nonce !== "string" ||
      data.nonce.length < 20 ||
      !equal(data.version || "", credentialVersion())
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
const csrfFor = (session: Session) =>
  hmac(`csrf:${session.nonce}`, settings().secret);
function requireOrigin(req: Request) {
  const c = settings();
  const origins = [c.origin];
  if (!c.production)
    origins.push("http://localhost:8080", "http://127.0.0.1:8080");
  if (
    c.localEditor &&
    /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(
      req.headers.host || "",
    )
  )
    origins.push(`http://${req.headers.host}`);
  if (
    typeof req.headers.origin !== "string" ||
    !origins.includes(req.headers.origin)
  )
    throw new HttpError(
      403,
      "This request must come from the portfolio's own admin page.",
    );
  if (
    (req.headers["content-type"] || "")
      .toString()
      .toLowerCase()
      .split(";")[0]
      .trim() !== "application/json"
  )
    throw new HttpError(415, "Use a JSON request.");
}
async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers["content-length"] || 0) > maxBodyBytes)
    throw new HttpError(413, "The request is too large.");
  let body = req.body;
  if (body === undefined) {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBodyBytes)
        throw new HttpError(413, "The request is too large.");
      chunks.push(buffer);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    if (Buffer.byteLength(body) > maxBodyBytes)
      throw new HttpError(413, "The request is too large.");
    try {
      body = JSON.parse(body);
    } catch {
      throw new HttpError(400, "Invalid JSON request.");
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new HttpError(400, "Invalid request body.");
  if (Buffer.byteLength(JSON.stringify(body)) > maxBodyBytes)
    throw new HttpError(413, "The request is too large.");
  return body as Record<string, unknown>;
}
// Per-instance limits provide a second line of defense. Also configure a Vercel
// Firewall rate limit for /api/admin login traffic; instances do not share memory.
const attempts = new Map<string, { count: number; reset: number }>();
let activeLogins = 0;
function allowLogin(req: Request) {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.reset <= now) attempts.delete(key);
  const address = settings().production
    ? (
        req.headers["x-vercel-forwarded-for"] ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "unknown"
      )
        .toString()
        .split(",")[0]
        .trim()
    : req.socket.remoteAddress || "local";
  for (const [key, limit] of [
    ["__global", 80],
    [address, 5],
  ] as const) {
    const value = attempts.get(key) || { count: 0, reset: now + 15 * 60_000 };
    if (value.count >= limit)
      throw new HttpError(
        429,
        "Too many sign-in attempts. Try again in 15 minutes.",
      );
    value.count++;
    attempts.set(key, value);
  }
  if (activeLogins >= 4)
    throw new HttpError(429, "Sign-in is busy. Please try again shortly.");
}
let expectedPassword: { version: string; hash: Buffer } | undefined;
async function passwordMatches(username: string, password: string) {
  const c = settings();
  const version = credentialVersion();
  if (!expectedPassword || expectedPassword.version !== version)
    expectedPassword = {
      version,
      hash: (await derive(c.password, c.secret, 64)) as Buffer,
    };
  const actual = (await derive(password, c.secret, 64)) as Buffer;
  return (
    timingSafeEqual(actual, expectedPassword.hash) &&
    equal(username, c.username)
  );
}
export interface StoredContent {
  content: PortfolioContent;
  sha: string;
}
async function readLocalContent(file: string): Promise<StoredContent> {
  try {
    const raw = await readFile(file, "utf8");
    if (Buffer.byteLength(raw) > 220_000) throw new Error("File too large");
    return {
      content: validateContent(JSON.parse(raw)),
      sha: createHash("sha256").update(raw).digest("hex"),
    };
  } catch {
    throw new HttpError(
      500,
      "The local portfolio content could not be read. Check that the project content file exists and contains valid JSON.",
    );
  }
}
let localWrite: Promise<unknown> = Promise.resolve();
function saveLocalContent(
  file: string,
  content: PortfolioContent,
  sha: string,
) {
  const task = localWrite
    .catch(() => undefined)
    .then(async () => {
      const current = await readLocalContent(file);
      if (current.sha !== sha)
        throw new HttpError(
          409,
          "The local content changed. Export your draft, reload the latest content, and merge your changes before saving.",
        );
      const raw = JSON.stringify(content, null, 2) + "\n";
      const temporary = `${file}.${randomBytes(8).toString("hex")}.tmp`;
      try {
        await writeFile(temporary, raw, { flag: "wx" });
        await rename(temporary, file);
        return { sha: createHash("sha256").update(raw).digest("hex") };
      } catch {
        throw new HttpError(
          500,
          "The local content could not be saved. Check write permissions for the project. Your browser draft is kept.",
        );
      } finally {
        await rm(temporary, { force: true }).catch(() => undefined);
      }
    });
  localWrite = task;
  return task;
}
export async function readStoredContent(): Promise<StoredContent> {
  const c = settings();
  if (c.localEditor) return readLocalContent(c.localFile);
  if (!c.storageConfigured)
    throw new HttpError(503, "Publishing storage has not been configured.");
  const url = `https://api.github.com/repos/${c.repository}/contents/${contentPath}?ref=${encodeURIComponent(c.branch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    throw new HttpError(
      502,
      "Published content could not be loaded. Check the repository, branch, and server token permissions.",
    );
  const data = (await response.json()) as {
    type?: string;
    encoding?: string;
    sha?: string;
    size?: number;
    content?: string;
  };
  if (
    data.type !== "file" ||
    data.encoding !== "base64" ||
    !/^[a-f0-9]{40,64}$/.test(data.sha || "") ||
    typeof data.size !== "number" ||
    data.size > 220_000 ||
    typeof data.content !== "string"
  )
    throw new HttpError(502, "The published content file is invalid.");
  try {
    return {
      content: validateContent(
        JSON.parse(Buffer.from(data.content, "base64").toString("utf8")),
      ),
      sha: data.sha!,
    };
  } catch {
    throw new HttpError(
      502,
      "The published content does not pass validation. Restore a valid portfolio JSON file.",
    );
  }
}
export async function saveStoredContent(
  content: PortfolioContent,
  sha: string,
) {
  const c = settings();
  if (c.localEditor) return saveLocalContent(c.localFile, content, sha);
  if (!c.storageConfigured)
    throw new HttpError(503, "Publishing storage has not been configured.");
  const current = await readStoredContent();
  if (current.sha !== sha)
    throw new HttpError(
      409,
      "The published content changed in another session. Export your draft, load the latest published content, and merge your changes before publishing.",
    );
  const response = await fetch(
    `https://api.github.com/repos/${c.repository}/contents/${contentPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${c.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: "Update portfolio content from admin panel",
        content: Buffer.from(JSON.stringify(content, null, 2) + "\n").toString(
          "base64",
        ),
        sha,
        branch: c.branch,
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (response.status === 409 || response.status === 422)
    throw new HttpError(
      409,
      "The content could not be saved because the branch changed or disallows direct updates. Export your draft, check branch rules, and reload published content.",
    );
  if (!response.ok) {
    // Only expose fixed diagnostics, never GitHub's response body or credentials.
    const rateLimited =
      response.status === 429 ||
      (response.status === 403 &&
        (response.headers.get("x-ratelimit-remaining") === "0" ||
          response.headers.has("retry-after")));
    const reason = rateLimited
      ? "GitHub temporarily limited publishing requests. Wait before trying again."
      : response.status === 401
        ? "GitHub rejected the server token. Replace an expired or revoked GITHUB_CONTENT_TOKEN in Vercel and redeploy."
        : response.status === 403
          ? "GitHub denied the update. Give the server token Contents: read and write access to this repository, and check branch rules and organization approval."
          : response.status === 404
            ? "GitHub could not access the update target. Check the token's selected repository, GITHUB_REPOSITORY, and GITHUB_BRANCH."
            : response.status >= 500
              ? "GitHub is temporarily unavailable. Try publishing again later."
              : "GitHub could not accept the update. Check the repository settings and server token permissions.";
    throw new HttpError(
      502,
      `${reason} (GitHub HTTP ${response.status}.) Your browser draft is kept.`,
    );
  }
  const data = (await response.json()) as { content?: { sha?: string } };
  if (!data.content?.sha)
    throw new HttpError(
      502,
      "The save response was incomplete. Reload published content before trying again.",
    );
  return { sha: data.content.sha };
}
function json(res: ServerResponse, status: number, value: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(value));
}
export async function adminHandler(req: Request, res: ServerResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    const action =
      new URL(req.url || "/api/admin", "http://localhost").searchParams.get(
        "action",
      ) || "session";
    const c = settings();
    const session = readSession(req);
    if (req.method === "GET" && action === "session")
      return json(res, 200, {
        configured: c.configured,
        storageConfigured: c.storageConfigured,
        storageMode: c.storageMode,
        authenticated: Boolean(session),
        ...(session ? { username: session.sub, csrf: csrfFor(session) } : {}),
      });
    if (req.method === "GET" && action === "public") {
      const data = await readStoredContent();
      if (!c.localEditor)
        res.setHeader(
          "Cache-Control",
          "public, max-age=0, s-maxage=30, stale-while-revalidate=30",
        );
      return json(res, 200, { content: data.content });
    }
    if (req.method === "GET" && action === "content") {
      if (!session)
        throw new HttpError(401, "Sign in to load published content.");
      return json(res, 200, await readStoredContent());
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      throw new HttpError(405, "This action is not available.");
    }
    requireOrigin(req);
    if (!c.configured)
      throw new HttpError(
        503,
        "Admin sign-in has not been configured on the server.",
      );
    if (action === "login") {
      allowLogin(req);
      const body = await readBody(req);
      if (
        typeof body.username !== "string" ||
        typeof body.password !== "string" ||
        body.username.length > 128 ||
        body.password.length > 1024
      )
        throw new HttpError(400, "Enter a valid username and password.");
      activeLogins++;
      let valid = false;
      try {
        valid = await passwordMatches(body.username, body.password);
      } finally {
        activeLogins--;
      }
      if (!valid)
        throw new HttpError(401, "The username or password is incorrect.");
      const next = createSession();
      setCookie(res, next.token, sessionSeconds);
      return json(res, 200, {
        configured: true,
        storageConfigured: c.storageConfigured,
        storageMode: c.storageMode,
        authenticated: true,
        username: c.username,
        csrf: csrfFor(next.session),
      });
    }
    if (!session)
      throw new HttpError(
        401,
        "Your session has expired. Sign in again; your draft is kept.",
      );
    const csrf = req.headers["x-csrf-token"];
    if (typeof csrf !== "string" || !equal(csrf, csrfFor(session)))
      throw new HttpError(
        403,
        "This session could not be verified. Reload the editor and sign in again.",
      );
    if (action === "logout") {
      setCookie(res, "", 0);
      return json(res, 200, { ok: true });
    }
    if (action !== "save") throw new HttpError(400, "Unknown action.");
    const body = await readBody(req);
    if (typeof body.sha !== "string" || !/^[a-f0-9]{40,64}$/.test(body.sha))
      throw new HttpError(400, "Load published content before saving changes.");
    let content: PortfolioContent;
    try {
      content = validateContent(body.content);
    } catch (e) {
      throw new HttpError(400, (e as Error).message);
    }
    return json(res, 200, await saveStoredContent(content, body.sha));
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 429) res.setHeader("Retry-After", "900");
      return json(res, error.status, { error: error.message });
    }
    // Never return upstream errors, environment variables, credentials, or tokens.
    return json(res, 500, {
      error:
        "The admin service could not finish this request. Your browser draft is kept.",
    });
  }
}
