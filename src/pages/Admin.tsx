import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Eye,
  LogOut,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { defaultContent } from "@/lib/portfolio-context";
import { validateContent, type PortfolioContent } from "@/lib/content-schema";
import "./admin.css";

const draftKey = "portfolio-admin-draft-v1";
type Tab =
  | "profile"
  | "socialLinks"
  | "projects"
  | "experience"
  | "skillGroups"
  | "education"
  | "contact"
  | "settings";
type Field = {
  key: string;
  label: string;
  type?: "textarea" | "url" | "email" | "list" | "boolean";
  hint?: string;
};
type Row = Record<string, string | boolean | string[]>;
interface Session {
  configured: boolean;
  authenticated: boolean;
  storageConfigured: boolean;
  storageMode?: "local" | "github";
  username?: string;
  csrf?: string;
}
interface Draft {
  content: PortfolioContent;
  sha: string | null;
}
const tabs: [Tab, string][] = [
  ["profile", "Profile & links"],
  ["socialLinks", "Social links"],
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["skillGroups", "Skills"],
  ["education", "Education & certificates"],
  ["contact", "Contact"],
  ["settings", "Headings & SEO"],
];
const fields: Record<string, Field[]> = {
  profile: [
    { key: "name", label: "Full name" },
    { key: "role", label: "Professional role" },
    { key: "greeting", label: "Hero heading" },
    { key: "status", label: "Status label" },
    { key: "location", label: "Location" },
    {
      key: "introduction",
      label: "Professional introduction",
      type: "textarea",
    },
    { key: "description", label: "About your work", type: "textarea" },
    { key: "email", label: "Contact email", type: "email" },
    {
      key: "resumeUrl",
      label: "Public résumé URL",
      type: "url",
      hint: "Leave blank to hide résumé links. Use a publicly accessible HTTPS link.",
    },
    { key: "projectsLabel", label: "Projects button label" },
    { key: "resumeLabel", label: "Résumé button label" },
    { key: "footerText", label: "Footer message" },
    {
      key: "heroImage",
      label: "Hero image URL",
      hint: "An HTTPS image URL or a local asset path. Leave blank to hide the artwork.",
    },
    { key: "heroImageAlt", label: "Hero image description" },
    {
      key: "heroPortrait",
      label: "Use portrait photo layout",
      type: "boolean",
    },
  ],
  socialLinks: [
    { key: "label", label: "Link label" },
    { key: "prefix", label: "Short prefix", hint: "For example: gh/ or in/" },
    { key: "url", label: "Profile URL", type: "url" },
    { key: "showInHero", label: "Show in the hero section", type: "boolean" },
  ],
  projects: [
    { key: "title", label: "Project name" },
    { key: "category", label: "Category" },
    { key: "description", label: "Project description", type: "textarea" },
    { key: "tags", label: "Technologies", type: "list" },
    { key: "liveUrl", label: "Live demo URL", type: "url" },
    { key: "sourceUrl", label: "Source code URL", type: "url" },
    {
      key: "imageUrl",
      label: "Project preview image URL",
      hint: "An HTTPS image URL or a local asset path such as /res/kalpriti-preview.webp.",
    },
    { key: "imageAlt", label: "Project image description" },
    {
      key: "context",
      label: "Additional context",
      hint: "For example, a client deployment or case study. Optional.",
    },
    {
      key: "featured",
      label: "Feature this project in the main grid",
      type: "boolean",
    },
  ],
  experience: [
    { key: "title", label: "Job title" },
    { key: "company", label: "Company" },
    { key: "context", label: "Team or project" },
    { key: "period", label: "Dates", hint: "For example: May 2024 — Present" },
    { key: "location", label: "Location / remote" },
    {
      key: "highlights",
      label: "Responsibilities & achievements",
      type: "list",
    },
    { key: "stack", label: "Technologies", type: "list" },
  ],
  skillGroups: [
    { key: "title", label: "Category name" },
    { key: "skills", label: "Skills", type: "list" },
  ],
  education: [
    { key: "title", label: "Qualification" },
    { key: "institution", label: "College or institution" },
    { key: "issuer", label: "Issuing university" },
    { key: "year", label: "Examination year" },
    {
      key: "credentialUrl",
      label: "Degree download URL",
      hint: "An HTTPS link or a local asset path. Leave blank to hide the download.",
    },
    { key: "description", label: "Description", type: "textarea" },
    {
      key: "status",
      label: "Status",
      hint: "For example: Graduated or In progress",
    },
  ],
  certifications: [
    { key: "title", label: "Certificate name" },
    { key: "issuer", label: "Issuing organization" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "url", label: "Credential URL", type: "url" },
  ],
  contact: [
    { key: "title", label: "Contact heading" },
    { key: "description", label: "Contact introduction", type: "textarea" },
    { key: "summaryLabel", label: "Summary label" },
    { key: "summary", label: "Recruiter summary", type: "textarea" },
  ],
  seo: [
    { key: "title", label: "Page title" },
    {
      key: "description",
      label: "Search & sharing description",
      type: "textarea",
    },
    {
      key: "image",
      label: "Social sharing image URL",
      hint: "Use an HTTPS URL or an existing local asset path such as /res/about.png.",
    },
    { key: "imageAlt", label: "Image description" },
  ],
  section: [
    { key: "title", label: "Section heading" },
    { key: "eyebrow", label: "Small section label" },
    { key: "note", label: "Supporting note" },
    { key: "navLabel", label: "Navigation label" },
  ],
};
function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      content: validateContent(data.content),
      sha: typeof data.sha === "string" ? data.sha : null,
    };
  } catch {
    return null;
  }
}
async function request(action: string, body?: unknown, csrf?: string) {
  const response = await fetch(`/api/admin?action=${action}`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body
      ? {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        }
      : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (
    !(response.headers.get("content-type") || "").includes("application/json")
  ) {
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(
      window.location.hostname,
    );
    throw new Error(
      local
        ? "The admin API returned a page instead of JSON. Restart pnpm dev and open the Local URL printed in that terminal; a static server cannot run the admin API."
        : "The admin API is missing from this deployment. Deploy the full Vercel project, including api/admin.ts.",
    );
  }
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "The request could not be completed."),
      { status: response.status },
    );
  if (
    ["session", "login"].includes(action) &&
    (typeof data.authenticated !== "boolean" ||
      typeof data.configured !== "boolean" ||
      typeof data.storageConfigured !== "boolean")
  )
    throw new Error(
      "The server returned an invalid admin session. Restart the development server and retry.",
    );
  return data;
}
function Fields({
  prefix,
  value,
  specs,
  onChange,
}: {
  prefix: string;
  value: Row;
  specs: Field[];
  onChange: (key: string, value: string | boolean | string[]) => void;
}) {
  return (
    <div className="admin-field-grid">
      {specs.map((field) => {
        const id = `${prefix}-${field.key}`;
        const current = value[field.key];
        if (field.type === "boolean")
          return (
            <label className="admin-check" key={id}>
              <input
                id={id}
                type="checkbox"
                checked={Boolean(current)}
                onChange={(e) => onChange(field.key, e.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          );
        const multi = field.type === "textarea" || field.type === "list";
        const props = {
          id,
          value: Array.isArray(current)
            ? current.join("\n")
            : String(current ?? ""),
          "aria-describedby":
            field.hint || field.type === "list" ? `${id}-hint` : undefined,
          onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange(
              field.key,
              field.type === "list"
                ? e.target.value.split("\n")
                : e.target.value,
            ),
        };
        return (
          <div className={`admin-field ${multi ? "is-wide" : ""}`} key={id}>
            <label htmlFor={id}>{field.label}</label>
            {multi ? (
              <textarea
                {...props}
                rows={field.type === "list" ? 4 : 3}
                onBlur={() => {
                  if (field.type === "list" && Array.isArray(current))
                    onChange(
                      field.key,
                      current.map((s) => s.trim()).filter(Boolean),
                    );
                }}
              />
            ) : (
              <input
                {...props}
                type={
                  field.type === "url"
                    ? "url"
                    : field.type === "email"
                      ? "email"
                      : "text"
                }
              />
            )}
            <p className="admin-field-hint" id={`${id}-hint`}>
              {field.hint ||
                (field.type === "list" ? "One entry per line." : "")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
function Collection({
  name,
  title,
  rows,
  onChange,
}: {
  name: string;
  title: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  const [removing, setRemoving] = useState<string | null>(null);
  const add = () => {
    const row: Row = { id: crypto.randomUUID() };
    fields[name].forEach((field) => {
      row[field.key] =
        field.type === "boolean" ? false : field.type === "list" ? [] : "";
    });
    onChange([...rows, row]);
  };
  const move = (index: number, delta: number) => {
    const next = [...rows];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };
  return (
    <section className="admin-collection" aria-label={title}>
      <div className="admin-collection-heading">
        <h2>
          {title} <span>{rows.length}</span>
        </h2>
        <button className="action" onClick={add}>
          <Plus size={15} /> Add{" "}
          {name === "skillGroups"
            ? "category"
            : name === "socialLinks"
              ? "link"
              : name === "certifications"
                ? "certificate"
                : "entry"}
        </button>
      </div>
      {rows.length === 0 && (
        <div className="admin-empty">
          No entries yet. Add your first one above.
        </div>
      )}
      {rows.map((row, index) => (
        <article className="admin-card" key={String(row.id)}>
          <div className="admin-card-heading">
            <h3>
              {String(row.title || row.label || `New entry ${index + 1}`)}
            </h3>
            <div className="admin-row-actions">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move ${row.title || row.label || "entry"} up`}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move ${row.title || row.label || "entry"} down`}
              >
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                onClick={() => setRemoving(String(row.id))}
                aria-label={`Remove ${row.title || row.label || "entry"}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {removing === row.id && (
            <div className="admin-remove-prompt">
              Remove this entry from your draft?
              <button
                onClick={() => {
                  onChange(rows.filter((r) => r.id !== row.id));
                  setRemoving(null);
                }}
              >
                Remove
              </button>
              <button onClick={() => setRemoving(null)}>Keep</button>
            </div>
          )}
          <Fields
            prefix={`${name}-${row.id}`}
            value={row}
            specs={fields[name]}
            onChange={(key, value) =>
              onChange(
                rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
              )
            }
          />
        </article>
      ))}
    </section>
  );
}
export default function Admin() {
  const [initial] = useState(readDraft);
  const [draft, setDraft] = useState<PortfolioContent>(
    initial?.content || defaultContent,
  );
  const [baseline, setBaseline] = useState<PortfolioContent>(defaultContent);
  const [sha, setSha] = useState<string | null>(initial?.sha || null);
  const [session, setSession] = useState<Session | null>(null);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [tab, setTab] = useState<Tab>("profile");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    initial ? "Your browser draft has been restored." : "",
  );
  const [busy, setBusy] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const previewRef = useRef<HTMLDialogElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const persisted = useRef(
    initial ? JSON.stringify(initial.content) : JSON.stringify(defaultContent),
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => {
    document.title = "Portfolio Admin | Content Editor";
    const tag =
      document.querySelector('meta[name="robots"]') ||
      document.createElement("meta");
    tag.setAttribute("name", "robots");
    tag.setAttribute("content", "noindex, nofollow");
    if (!tag.isConnected) document.head.append(tag);
    document
      .querySelectorAll(
        'link[rel="canonical"], script[type="application/ld+json"]',
      )
      .forEach((node) => node.remove());
    document.documentElement.classList.add("dark");
  }, []);
  useEffect(() => {
    let cancelled = false;
    setConnectionFailed(false);
    request("session")
      .then(async (state) => {
        if (cancelled) return;
        setSession(state);
        if (state.authenticated && state.storageConfigured) {
          const data = await request("content");
          if (cancelled) return;
          const content = validateContent(data.content);
          setBaseline(content);
          if (!initial) {
            setDraft(content);
            setSha(data.sha);
            persisted.current = JSON.stringify(content);
          } else
            setSha(
              initial.sha ||
                (JSON.stringify(content) === JSON.stringify(defaultContent)
                  ? data.sha
                  : null),
            );
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setConnectionFailed(true);
          setError(
            e instanceof Error
              ? e.message
              : "The admin API could not be reached. Restart pnpm dev and retry. Your draft is kept.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initial, connectionAttempt]);
  useEffect(() => {
    setDraftSaved(false);
    const timer = window.setTimeout(() => {
      if (!dirty) return;
      try {
        const content = validateContent(draft);
        localStorage.setItem(draftKey, JSON.stringify({ content, sha }));
        persisted.current = JSON.stringify(draft);
        setDraftSaved(true);
      } catch {
        /* Incomplete or invalid edits stay in memory until valid. */
      }
    }, 500);
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(draft) !== persisted.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", warn);
    };
  }, [draft, sha, dirty]);
  const update = (
    section: keyof PortfolioContent,
    key: string,
    value: unknown,
  ) => {
    setError("");
    setMessage("");
    setDraft((previous) => ({
      ...previous,
      [section]: { ...(previous[section] as object), [key]: value },
    }));
  };
  const collection = (
    name:
      | "projects"
      | "experience"
      | "skillGroups"
      | "education"
      | "certifications"
      | "socialLinks",
    title: string,
  ) => (
    <Collection
      key={name}
      name={name}
      title={title}
      rows={draft[name] as unknown as Row[]}
      onChange={(rows) => {
        setDraft((previous) => ({ ...previous, [name]: rows }));
        setError("");
        setMessage("");
      }}
    />
  );
  const loadPublished = async () => {
    if (
      dirty &&
      !window.confirm(
        "Replace your local draft with the published content? Export a backup first if you want to keep your changes.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const data = await request("content");
      const content = validateContent(data.content);
      setDraft(content);
      setBaseline(content);
      setSha(data.sha);
      localStorage.removeItem(draftKey);
      persisted.current = JSON.stringify(content);
      setMessage("Published content loaded.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request("login", credentials);
      setSession(data);
      setCredentials({ username: "", password: "" });
      if (!data.storageConfigured) {
        setMessage(
          "Signed in. You can edit and export a draft; publishing storage is not configured on this server.",
        );
        return;
      }
      const remote = await request("content");
      const content = validateContent(remote.content);
      if (!dirty) {
        setDraft(content);
        persisted.current = JSON.stringify(content);
        setSha(remote.sha);
      } else if (!sha && JSON.stringify(content) === JSON.stringify(baseline))
        setSha(remote.sha);
      else if (!sha)
        setMessage(
          "Signed in. Load published content before publishing this offline draft. Export your draft first to keep a backup.",
        );
      setBaseline(content);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    setBusy(true);
    setError("");
    try {
      const content = validateContent(draft);
      const data = await request("save", { content, sha }, session?.csrf);
      setSha(data.sha);
      setBaseline(content);
      setDraft(content);
      localStorage.removeItem(draftKey);
      persisted.current = JSON.stringify(content);
      setMessage(
        session?.storageMode === "local"
          ? "Saved to your project. The local portfolio is updated; deploy these changes to update the live site."
          : "Saved. Visitors will receive the update within about a minute. Search-engine HTML updates after Vercel rebuilds.",
      );
    } catch (e) {
      if ((e as { status?: number }).status === 401)
        setSession((s) =>
          s ? { ...s, authenticated: false, csrf: undefined } : s,
        );
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    setError("");
    try {
      await request("logout", {}, session?.csrf);
      setSession((s) =>
        s ? { ...s, authenticated: false, csrf: undefined } : s,
      );
      setMessage("Signed out. Your browser draft is kept.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportDraft = () => {
    try {
      const content = validateContent(draft);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(content, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "portfolio-content.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const importDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 220_000)
        throw new Error("Choose a portfolio JSON file under 220 KB.");
      const content = validateContent(JSON.parse(await file.text()));
      setDraft(content);
      setError("");
      setMessage("Backup imported as a draft. Preview it before publishing.");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const preview = () => {
    try {
      sessionStorage.setItem(
        "portfolio-admin-preview",
        JSON.stringify(validateContent(draft)),
      );
      setPreviewVersion(Date.now());
      previewRef.current?.showModal();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <a href="/" className="admin-brand">
            ~/ {draft.profile.name}
          </a>
          <span className="admin-header-tag">CONTENT EDITOR</span>
        </div>
        <a className="admin-back" href="/">
          View portfolio ↗
        </a>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="eyebrow">YOUR PORTFOLIO</p>
          <nav aria-label="Content sections">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                aria-pressed={tab === key}
                disabled={!session?.authenticated}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <p className="admin-sidebar-note">
            Sign in to edit. Drafts stay in this browser until you publish.
          </p>
        </aside>
        <div className="admin-main">
          <div className="admin-title">
            <div>
              <p className="eyebrow">MAKE IT YOURS</p>
              <h1>Portfolio admin</h1>
              <p>Keep your work, experience, and links up to date.</p>
            </div>
            <div className="admin-publish-state">
              <span className="status-dot" />
              {dirty
                ? draftSaved
                  ? "Draft saved in browser"
                  : "Unpublished changes"
                : "No unpublished changes"}
            </div>
          </div>
          {!session?.authenticated && (
            <section className="admin-auth" aria-labelledby="signin-title">
              <div>
                <h2 id="signin-title">Sign in to manage your portfolio</h2>
                <p>
                  {session?.configured
                    ? "Use your admin username and password to unlock the editor."
                    : connectionFailed
                      ? "The admin API could not be loaded. Your draft is safe; check the message below and retry."
                      : session === null
                        ? "Checking whether publishing is available…"
                        : "Admin access is not configured for this site yet. Set up the server environment to enable sign-in."}
                </p>
              </div>
              <form onSubmit={login}>
                <label htmlFor="admin-username">
                  Username
                  <input
                    id="admin-username"
                    autoComplete="username"
                    required
                    maxLength={128}
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials((c) => ({
                        ...c,
                        username: e.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="admin-password">
                  Password
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={1024}
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials((c) => ({
                        ...c,
                        password: e.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  className="action primary"
                  disabled={busy || session === null || connectionFailed}
                  type="submit"
                >
                  Sign in
                </button>
              </form>
              {connectionFailed && (
                <button
                  className="action"
                  onClick={() => {
                    setError("");
                    setConnectionAttempt((n) => n + 1);
                  }}
                >
                  Retry connection
                </button>
              )}
            </section>
          )}
          {session?.authenticated && (
            <div className="admin-session">
              <span>
                <Check size={14} /> Signed in as {session.username}
              </span>
              <div>
                <button
                  disabled={busy || !session.storageConfigured}
                  onClick={loadPublished}
                >
                  {session.storageMode === "local"
                    ? "Reload saved content"
                    : "Load published content"}
                </button>
                <button disabled={busy} onClick={logout}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
          {session?.authenticated && !session.storageConfigured && (
            <p className="admin-notice">
              Publishing storage is not configured. Draft editing and JSON
              backups are available.
            </p>
          )}
          {session?.authenticated && session.storageConfigured && !sha && (
            <p className="admin-notice">
              This draft has no published baseline. Export a backup, load
              published content, then import the draft to publish safely.
            </p>
          )}
          {session?.authenticated && (
            <div className="admin-toolbar">
              <button className="action" onClick={preview}>
                <Eye size={15} /> Preview draft
              </button>
              <button className="action" onClick={exportDraft}>
                <Download size={15} /> Export JSON
              </button>
              <button
                className="action"
                onClick={() => importRef.current?.click()}
              >
                <Upload size={15} /> Import JSON
              </button>
              <input
                ref={importRef}
                hidden
                type="file"
                accept="application/json,.json"
                onChange={importDraft}
              />
              <button
                className="action primary admin-publish"
                disabled={
                  busy ||
                  !session?.authenticated ||
                  !session.storageConfigured ||
                  !sha ||
                  !dirty
                }
                onClick={publish}
              >
                <Save size={15} />
                {busy
                  ? "Working…"
                  : session?.storageMode === "local"
                    ? "Save to project"
                    : "Publish changes"}
              </button>
            </div>
          )}
          <div aria-live="polite" className="admin-feedback">
            {message && <p role="status">{message}</p>}
            {error && (
              <p role="alert" className="admin-error">
                {error}
              </p>
            )}
          </div>
          {session?.authenticated && (
            <div className="admin-content">
              {tab === "profile" && (
                <section className="admin-card">
                  <h2>Profile & primary links</h2>
                  <Fields
                    prefix="profile"
                    value={draft.profile}
                    specs={fields.profile}
                    onChange={(key, value) => update("profile", key, value)}
                  />
                </section>
              )}
              {tab === "socialLinks" &&
                collection("socialLinks", "Social links")}
              {tab === "projects" && collection("projects", "Projects")}
              {tab === "experience" && collection("experience", "Experience")}
              {tab === "skillGroups" &&
                collection("skillGroups", "Skill categories")}
              {tab === "education" && (
                <>
                  {collection("education", "Education")}
                  {collection("certifications", "Certifications")}
                </>
              )}
              {tab === "contact" && (
                <section className="admin-card">
                  <h2>Contact & recruiter summary</h2>
                  <Fields
                    prefix="contact"
                    value={draft.contact}
                    specs={fields.contact}
                    onChange={(key, value) => update("contact", key, value)}
                  />
                  <p className="admin-notice">
                    Edit your email and résumé link under Profile & links.
                  </p>
                </section>
              )}
              {tab === "settings" && (
                <>
                  <section className="admin-card">
                    <h2>Search & social sharing</h2>
                    <Fields
                      prefix="seo"
                      value={draft.seo}
                      specs={fields.seo}
                      onChange={(key, value) => update("seo", key, value)}
                    />
                    <p className="admin-field-hint">
                      The canonical domain remains https://adeshgupta.site/. The
                      admin panel stays out of search results.
                    </p>
                  </section>
                  {Object.entries(draft.sections).map(([key, value]) => (
                    <section className="admin-card" key={key}>
                      <h2>{value.navLabel} section</h2>
                      <Fields
                        prefix={`section-${key}`}
                        value={value as unknown as Row}
                        specs={fields.section}
                        onChange={(field, next) =>
                          setDraft((p) => ({
                            ...p,
                            sections: {
                              ...p.sections,
                              [key]: {
                                ...p.sections[key as keyof typeof p.sections],
                                [field]: next,
                              },
                            },
                          }))
                        }
                      />
                    </section>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <dialog ref={previewRef} className="admin-preview">
        <div className="admin-preview-heading">
          <span>Draft preview · visible only to you</span>
          <button
            autoFocus
            onClick={() => previewRef.current?.close()}
            aria-label="Close draft preview"
          >
            <X size={20} />
          </button>
        </div>
        <iframe
          title="Draft portfolio preview"
          src={
            previewVersion
              ? `/?admin-preview=1&v=${previewVersion}`
              : "about:blank"
          }
        />
      </dialog>
    </main>
  );
}
