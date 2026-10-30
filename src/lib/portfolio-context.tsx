/* eslint-disable react-refresh/only-export-components -- The provider and its context hook share one module. */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import defaultData from "./portfolio.json";
import { validateContent, type PortfolioContent } from "./content-schema";
import { updateDocumentMetadata } from "./metadata";

export const defaultContent = validateContent(defaultData);
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
      try {
        const data = sessionStorage.getItem("portfolio-admin-preview");
        if (data) setContent(validateContent(JSON.parse(data)));
        const tag = document.querySelector('meta[name="robots"]');
        if (tag) tag.setAttribute("content", "noindex, nofollow");
      } catch {
        /* An invalid draft never replaces the portfolio. */
      }
      return;
    }
    const controller = new AbortController();
    fetch("/api/admin?action=public", {
      signal: controller.signal,
      credentials: "omit",
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const next = validateContent(data.content);
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
