/* eslint-disable react-refresh/only-export-components -- The provider and its context hook share one module. */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import defaultData from "./portfolio.json";
import type { PortfolioContent } from "./content-schema";

// Vite validates and normalizes this trusted source at build time, for SSR and
// the browser alike. Remote content and imported drafts still need validation.
export const defaultContent = defaultData as PortfolioContent;
const defaultSnapshot = JSON.stringify(defaultContent);
const PortfolioContext = createContext<PortfolioContent>(defaultContent);
export const usePortfolio = () => useContext(PortfolioContext);
export function PortfolioProvider({
  children,
  content: preview,
}: {
  children: ReactNode;
  content?: PortfolioContent;
}) {
  const [content, setContent] = useState(defaultContent);
  useEffect(() => {
    if (preview) return;
    if (
      new URLSearchParams(window.location.search).has("admin-preview") &&
      window.parent !== window
    ) {
      let active = true;
      try {
        const data = sessionStorage.getItem("portfolio-admin-preview");
        if (data) {
          void import("./content-schema")
            .then(({ validateContent }) => {
              const draft = validateContent(JSON.parse(data));
              if (active) setContent(draft);
            })
            .catch(() => {
              /* An invalid draft never replaces the portfolio. */
            });
        }
        const tag = document.querySelector('meta[name="robots"]');
        if (tag) tag.setAttribute("content", "noindex, nofollow");
      } catch {
        /* An invalid draft never replaces the portfolio. */
      }
      return () => {
        active = false;
      };
    }
    const controller = new AbortController();
    fetch("/api/admin?action=public", {
      signal: controller.signal,
      credentials: "omit",
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        // Prerendered content is already current on most visits. Avoid a second
        // full-page render, validator download, and metadata rewrite when it is
        // byte-for-byte equivalent to our build-validated source.
        if (JSON.stringify(data.content) === defaultSnapshot) return;
        const { validateContent } = await import("./content-schema");
        if (controller.signal.aborted) return;
        const next = validateContent(data.content);
        const { updateDocumentMetadata } = await import("./metadata");
        if (controller.signal.aborted) return;
        setContent(next);
        updateDocumentMetadata(next);
      })
      .catch(() => {
        /* The prerendered bundled content remains available offline or without the API. */
      });
    return () => controller.abort();
  }, [preview]);
  return (
    <PortfolioContext.Provider value={preview || content}>
      {children}
    </PortfolioContext.Provider>
  );
}
