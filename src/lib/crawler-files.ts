import type { PortfolioContent } from "./content-schema";

export const canonicalOrigin = "https://adeshgupta.site";
const text = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\[\]<>`]/g, "\\$&");
const link = (label: string, url: string, description: string) =>
  `- [${text(label)}](<${url.replace(/</g, "%3C").replace(/>/g, "%3E")}>): ${text(description)}`;

export function renderLlms(content: PortfolioContent): string {
  const { profile: p } = content;
  const lines = [
    `# ${text(p.name)}`,
    "",
    `> ${text(p.role)}. ${text(p.introduction)}`,
    "",
    text(p.description),
    "",
    "## Portfolio",
    link(
      "Professional profile",
      `${canonicalOrigin}/`,
      `${p.name}, ${p.role}, ${p.location}.`,
    ),
    link(
      content.sections.experience.title,
      `${canonicalOrigin}/#about`,
      "Work experience and responsibilities.",
    ),
    link(
      content.sections.projects.title,
      `${canonicalOrigin}/#projects`,
      "Software projects, their purpose, technologies, and public links.",
    ),
    link(
      content.sections.skills.title,
      `${canonicalOrigin}/#skills`,
      "Programming languages, frameworks, tools, and databases.",
    ),
    link(
      content.sections.education.title,
      `${canonicalOrigin}/#achievements`,
      "Education and certifications.",
    ),
    link("Contact", `${canonicalOrigin}/#contact`, p.email),
    "",
    "## Projects",
    ...content.projects.map((project) =>
      link(
        project.title,
        project.liveUrl ||
          project.sourceUrl ||
          `${canonicalOrigin}/#work-${encodeURIComponent(project.id)}`,
        `${project.description} Technologies: ${project.tags.join(", ")}.${project.context ? ` ${project.context}.` : ""}`,
      ),
    ),
    "",
    "## Experience",
    ...content.experience.map(
      (entry) =>
        `- **${text(entry.title)} — ${text(entry.company)}** (${text(entry.period)}; ${text(entry.location)}). ${text(entry.context)}${entry.context ? ". " : ""}${text(entry.highlights.join(" "))}${entry.stack.length ? ` Technologies: ${text(entry.stack.join(", "))}.` : ""}`,
    ),
    "",
    "## Technical skills",
    ...content.skillGroups.map(
      (group) =>
        `- **${text(group.title)}**: ${text(group.skills.join(", "))}.`,
    ),
    "",
    "## Education and certifications",
    ...content.education.map(
      (entry) =>
        `- **${text(entry.title)}**, ${text(entry.institution)}. ${entry.issuer ? `Issued by ${text(entry.issuer)}. ` : ""}${entry.year ? `Examination year: ${text(entry.year)}. ` : ""}${text([entry.description, entry.status].filter(Boolean).join(". "))}.`,
    ),
    ...content.certifications.map((cert) =>
      cert.url
        ? link(
            cert.title,
            cert.url,
            `${cert.issuer}${cert.description ? ` — ${cert.description}` : ""}.`,
          )
        : `- **${text(cert.title)}**, ${text(cert.issuer)}${cert.description ? ` — ${text(cert.description)}` : ""}.`,
    ),
    "",
    "## Professional links",
    ...content.socialLinks
      .filter((s) => s.url)
      .map((s) => link(s.label, s.url, `${p.name}'s ${s.label} profile.`)),
    "",
    "## Contact",
    `Email: ${text(p.email)}`,
    "",
    text(content.contact.summary),
    "",
    "## Optional",
    link(
      "XML sitemap",
      `${canonicalOrigin}/sitemap.xml`,
      "Canonical public page URLs.",
    ),
    "",
  ];
  return lines.join("\n");
}

export function crawlerFiles(
  content: PortfolioContent,
): Record<string, string> {
  const llms = renderLlms(content);
  return {
    "robots.txt": `# Allow the public portfolio and its rendering assets.\n# Admin pages use noindex; leave them crawlable so that directive can be read.\nUser-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${canonicalOrigin}/sitemap.xml\n`,
    "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${canonicalOrigin}/</loc>\n  </url>\n</urlset>\n`,
    "llms.txt": llms,
    // Compatibility for the singular spelling requested by the owner.
    "llm.txt": llms,
  };
}
