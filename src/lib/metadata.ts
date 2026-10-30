import type { PortfolioContent } from "./content-schema";
import { canonicalOrigin } from "./crawler-files.ts";
export const productionOrigin = canonicalOrigin;
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function metadata(content: PortfolioContent) {
  const { profile: p, seo } = content;
  const image = seo.image ? new URL(seo.image, productionOrigin).href : "";
  const topics = [...new Set([
    p.role,
    ...content.skillGroups.flatMap((group) => group.skills),
    ...content.projects.flatMap((project) => project.tags),
  ])];
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${productionOrigin}/#person`,
        name: p.name,
        url: `${productionOrigin}/`,
        jobTitle: p.role,
        email: `mailto:${p.email}`,
        description: p.introduction,
        mainEntityOfPage: { "@id": `${productionOrigin}/#profile` },
        homeLocation: { "@type": "Place", name: p.location },
        alumniOf: content.education.map((entry) => ({
          "@type": "EducationalOrganization",
          name: entry.institution,
        })),
        ...(image ? { image } : {}),
        sameAs: content.socialLinks.filter((s) => s.url).map((s) => s.url),
        knowsAbout: topics,
      },
      {
        "@type": "WebSite",
        "@id": `${productionOrigin}/#website`,
        url: `${productionOrigin}/`,
        name: `${p.name} Portfolio`,
        alternateName: p.name,
        inLanguage: "en",
        publisher: { "@id": `${productionOrigin}/#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${productionOrigin}/#profile`,
        url: `${productionOrigin}/`,
        name: seo.title,
        description: seo.description,
        inLanguage: "en",
        about: { "@id": `${productionOrigin}/#person` },
        ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image, caption: seo.imageAlt } } : {}),
        isPartOf: { "@id": `${productionOrigin}/#website` },
        mainEntity: { "@id": `${productionOrigin}/#person` },
        hasPart: content.projects.map((project) => ({
          "@id": `${productionOrigin}/#work-${encodeURIComponent(project.id)}`,
        })),
      },
      ...content.projects.map((project) => ({
        "@type": "CreativeWork",
        "@id": `${productionOrigin}/#work-${encodeURIComponent(project.id)}`,
        name: project.title,
        description: project.description,
        url:
          project.liveUrl ||
          project.sourceUrl ||
          `${productionOrigin}/#work-${encodeURIComponent(project.id)}`,
        creator: { "@id": `${productionOrigin}/#person` },
        keywords: project.tags,
      })),
    ],
  };
  const tags: Array<[string, string, string]> = [
    ["name", "description", seo.description],
    ["name", "author", p.name],
    ["property", "og:type", "profile"],
    ["property", "og:site_name", `${p.name} Portfolio`],
    ["property", "og:locale", "en_US"],
    ["property", "og:title", seo.title],
    ["property", "og:description", seo.description],
    ["property", "og:url", `${productionOrigin}/`],
    ["name", "twitter:card", "summary"],
    ["name", "twitter:title", seo.title],
    ["name", "twitter:description", seo.description],
  ];
  if (image)
    tags.push(
      ["property", "og:image", image],
      ["property", "og:image:alt", seo.imageAlt],
      ["name", "twitter:image", image],
      ["name", "twitter:image:alt", seo.imageAlt],
    );
  return { title: seo.title, tags, graph };
}
export function metadataMarkup(content: PortfolioContent) {
  const data = metadata(content);
  return `<title>${escape(data.title)}</title>\n<link rel="canonical" href="${productionOrigin}/" />\n<link rel="describedby" href="${productionOrigin}/llms.txt" type="text/plain" />\n${data.tags.map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escape(value)}" />`).join("\n")}\n<script type="application/ld+json">${JSON.stringify(data.graph).replace(/</g, "\\u003c")}</script>`;
}
export function updateDocumentMetadata(content: PortfolioContent) {
  const data = metadata(content);
  document.title = data.title;
  for (const [attr, key, value] of data.tags) {
    let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.append(tag);
    }
    tag.content = value;
  }
  if (!content.seo.image)
    document
      .querySelectorAll(
        'meta[property="og:image"],meta[property="og:image:alt"],meta[name="twitter:image"],meta[name="twitter:image:alt"]',
      )
      .forEach((node) => node.remove());
  const script =
    document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    ) || document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data.graph).replace(/</g, "\\u003c");
  if (!script.isConnected) document.head.append(script);
}
