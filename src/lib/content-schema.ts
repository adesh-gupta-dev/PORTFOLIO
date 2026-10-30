export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  liveUrl: string;
  sourceUrl: string;
  context: string;
  featured: boolean;
  imageUrl: string;
  imageAlt: string;
}
export interface Experience {
  id: string;
  title: string;
  company: string;
  context: string;
  period: string;
  location: string;
  highlights: string[];
  stack: string[];
}
export interface SkillGroup {
  id: string;
  title: string;
  skills: string[];
}
export interface Education {
  id: string;
  title: string;
  institution: string;
  description: string;
  status: string;
  issuer: string;
  year: string;
  credentialUrl: string;
}
export interface Certification {
  id: string;
  title: string;
  issuer: string;
  description: string;
  url: string;
}
export interface SocialLink {
  id: string;
  label: string;
  prefix: string;
  url: string;
  showInHero: boolean;
}
export interface SectionSettings {
  title: string;
  eyebrow: string;
  note: string;
  navLabel: string;
}
export interface PortfolioContent {
  version: 1;
  profile: {
    name: string;
    role: string;
    greeting: string;
    status: string;
    location: string;
    introduction: string;
    description: string;
    email: string;
    resumeUrl: string;
    projectsLabel: string;
    resumeLabel: string;
    footerText: string;
    heroImage: string;
    heroImageAlt: string;
    heroPortrait: boolean;
  };
  socialLinks: SocialLink[];
  experience: Experience[];
  projects: Project[];
  skillGroups: SkillGroup[];
  education: Education[];
  certifications: Certification[];
  sections: {
    experience: SectionSettings;
    projects: SectionSettings;
    skills: SectionSettings;
    education: SectionSettings;
  };
  contact: {
    title: string;
    description: string;
    summaryLabel: string;
    summary: string;
  };
  seo: { title: string; description: string; image: string; imageAlt: string };
}

// The same validation runs in the editor, public reader, and write API.
// Build a clean object so unexpected keys never become persisted content.
export function validateContent(input: unknown): PortfolioContent {
  const object = (value: unknown, label: string): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error(`${label} must be an object.`);
    return value as Record<string, unknown>;
  };
  const text = (
    value: unknown,
    label: string,
    max = 1000,
    required = true,
  ): string => {
    if (
      typeof value !== "string" ||
      value.length > max ||
      Array.from(value).some((c) => {
        const code = c.charCodeAt(0);
        return code < 32 && code !== 9 && code !== 10 && code !== 13;
      })
    )
      throw new Error(`${label} must be text of at most ${max} characters.`);
    if (required && !value.trim()) throw new Error(`${label} is required.`);
    return value.trim();
  };
  const bool = (value: unknown, label: string): boolean => {
    if (typeof value !== "boolean")
      throw new Error(`${label} must be true or false.`);
    return value;
  };
  const url = (
    value: unknown,
    label: string,
    allowRelative = false,
  ): string => {
    const result = text(value, label, 2048, false);
    if (!result) return "";
    if (allowRelative && /^\/(?!\/)[^\\\s]*$/.test(result)) return result;
    try {
      const parsed = new URL(result);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password)
        throw new Error();
      return parsed.href;
    } catch {
      throw new Error(
        `${label} must be a full HTTPS URL${allowRelative ? " or a local /asset path" : ""}.`,
      );
    }
  };
  const list = <T>(
    value: unknown,
    label: string,
    map: (item: Record<string, unknown>, label: string) => T,
    max = 100,
  ): T[] => {
    if (!Array.isArray(value) || value.length > max)
      throw new Error(`${label} must be a list of at most ${max} items.`);
    const ids = new Set<string>();
    return value.map((item, index) => {
      const itemLabel = `${label} ${index + 1}`;
      const row = object(item, itemLabel);
      const id = text(row.id, `${itemLabel} ID`, 80);
      if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id))
        throw new Error(
          `${itemLabel} needs a unique ID using letters, numbers, underscores or hyphens.`,
        );
      ids.add(id);
      return map(row, itemLabel);
    });
  };
  const strings = (
    value: unknown,
    label: string,
    max = 100,
    length = 300,
  ): string[] => {
    if (!Array.isArray(value) || value.length > max)
      throw new Error(`${label} must be a list of at most ${max} entries.`);
    return value.map((item, index) =>
      text(item, `${label} ${index + 1}`, length),
    );
  };
  const root = object(input, "Portfolio");
  if (root.version !== 1)
    throw new Error("Unsupported portfolio file version.");
  const p = object(root.profile, "Profile");
  const c = object(root.contact, "Contact");
  const seo = object(root.seo, "SEO");
  const sections = object(root.sections, "Sections");
  const section = (key: string): SectionSettings => {
    const row = object(sections[key], key);
    return {
      title: text(row.title, `${key} heading`, 160),
      eyebrow: text(row.eyebrow, `${key} label`, 160),
      note: text(row.note, `${key} note`, 200, false),
      navLabel: text(row.navLabel, `${key} navigation label`, 40),
    };
  };
  const email = text(p.email, "Email", 254);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
    throw new Error("Enter a valid contact email address.");
  const result: PortfolioContent = {
    version: 1,
    profile: {
      name: text(p.name, "Name", 120),
      role: text(p.role, "Role", 120),
      greeting: text(p.greeting, "Greeting", 160),
      status: text(p.status, "Status", 120),
      location: text(p.location, "Location", 120),
      introduction: text(p.introduction, "Introduction", 1000),
      description: text(p.description, "Description", 2000),
      email,
      resumeUrl: url(p.resumeUrl, "Resume link"),
      projectsLabel: text(p.projectsLabel, "Projects button label", 60),
      resumeLabel: text(p.resumeLabel, "Resume button label", 60),
      footerText: text(p.footerText, "Footer text", 160),
      heroImage: url(
        p.heroImage ?? "/res/electric-core.webp",
        "Hero image",
        true,
      ),
      heroImageAlt: text(
        p.heroImageAlt ?? "Abstract glass cube with electric blue circuits",
        "Hero image description",
        300,
        false,
      ),
      heroPortrait: bool(p.heroPortrait ?? false, "Portrait photo layout"),
    },
    socialLinks: list(
      root.socialLinks,
      "Social links",
      (r, l) => ({
        id: r.id as string,
        label: text(r.label, `${l} label`, 60),
        prefix: text(r.prefix, `${l} prefix`, 20),
        url: url(r.url, `${l} URL`),
        showInHero: bool(r.showInHero, `${l} hero visibility`),
      }),
      20,
    ),
    projects: list(root.projects, "Projects", (r, l) => ({
      id: r.id as string,
      title: text(r.title, `${l} title`, 160),
      category: text(r.category, `${l} category`, 100, false),
      description: text(r.description, `${l} description`, 4000),
      tags: strings(r.tags, `${l} technologies`, 30, 80),
      liveUrl: url(r.liveUrl, `${l} live URL`),
      sourceUrl: url(r.sourceUrl, `${l} source URL`),
      context: text(r.context, `${l} context`, 200, false),
      featured: bool(r.featured, `${l} featured`),
      imageUrl: url(r.imageUrl ?? "", `${l} preview image`, true),
      imageAlt: text(
        r.imageAlt ?? "",
        `${l} preview image description`,
        300,
        false,
      ),
    })),
    experience: list(
      root.experience,
      "Experience",
      (r, l) => ({
        id: r.id as string,
        title: text(r.title, `${l} role`, 160),
        company: text(r.company, `${l} company`, 160),
        context: text(r.context, `${l} context`, 200, false),
        period: text(r.period, `${l} dates`, 120),
        location: text(r.location, `${l} location`, 160),
        highlights: strings(r.highlights, `${l} highlights`, 30, 2000),
        stack: strings(r.stack, `${l} technologies`, 30, 80),
      }),
      50,
    ),
    skillGroups: list(
      root.skillGroups,
      "Skill groups",
      (r, l) => ({
        id: r.id as string,
        title: text(r.title, `${l} category`, 120),
        skills: strings(r.skills, `${l} skills`, 100, 100),
      }),
      30,
    ),
    education: list(
      root.education,
      "Education",
      (r, l) => ({
        id: r.id as string,
        title: text(r.title, `${l} qualification`, 200),
        institution: text(r.institution, `${l} institution`, 200),
        description: text(r.description, `${l} description`, 1000, false),
        status: text(r.status, `${l} status`, 100, false),
        issuer: text(r.issuer ?? "", `${l} university`, 200, false),
        year: text(r.year ?? "", `${l} examination year`, 20, false),
        credentialUrl: url(
          r.credentialUrl ?? "",
          `${l} credential download`,
          true,
        ),
      }),
      30,
    ),
    certifications: list(root.certifications, "Certifications", (r, l) => ({
      id: r.id as string,
      title: text(r.title, `${l} title`, 200),
      issuer: text(r.issuer, `${l} issuer`, 200),
      description: text(r.description, `${l} description`, 1000, false),
      url: url(r.url, `${l} URL`),
    })),
    sections: {
      experience: section("experience"),
      projects: section("projects"),
      skills: section("skills"),
      education: section("education"),
    },
    contact: {
      title: text(c.title, "Contact heading", 200),
      description: text(c.description, "Contact description", 2000),
      summaryLabel: text(c.summaryLabel, "Recruiter summary label", 160),
      summary: text(c.summary, "Recruiter summary", 3000),
    },
    seo: {
      title: text(seo.title, "SEO title", 160),
      description: text(seo.description, "SEO description", 500),
      image: url(seo.image, "Social image", true),
      imageAlt: text(seo.imageAlt, "Social image description", 300),
    },
  };
  if (JSON.stringify(result).length > 200_000)
    throw new Error("Portfolio content must be under 200 KB.");
  return result;
}
