import { ArrowUpRight, Github, Braces, Database, Network } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { usePortfolio } from "@/lib/portfolio-context";
import type { Project } from "@/lib/content-schema";
const ProjectsSection = () => {
  const { projects, sections, socialLinks } = usePortfolio();
  const s = sections.projects;
  const github = socialLinks.find((link) => link.id === "github" && link.url);
  const featured = projects.filter((project) => project.featured);
  const archived = projects.filter((project) => !project.featured);
  return (
    <section
      id="projects"
      className="portfolio-section"
      aria-labelledby="projects-heading"
    >
      <div className="section-rule">
        <span>02_DEPLOYS</span>
        <span>+</span>
      </div>
      <ScrollReveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id="projects-heading">{s.title}</h2>
          </div>
          {github ? (
            <a
              className="section-note text-link"
              href={github.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.note} ↗
            </a>
          ) : (
            <span className="section-note">{s.note}</span>
          )}
        </div>
      </ScrollReveal>
      <div className="project-grid">
        {featured.map((project, index) => (
          <ScrollReveal key={project.id} delay={(index % 2) * 0.06}>
            <ProjectCard project={project} index={index} />
          </ScrollReveal>
        ))}
      </div>
      {archived.length > 0 && (
        <div className="more-projects">
          <h3 className="eyebrow">MORE EXPLORATIONS</h3>
          <div className="project-archive">
            {archived.map((project, index) => (
              <ScrollReveal key={project.id}>
                <ProjectCard
                  project={project}
                  index={index + featured.length}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
const ProjectCard = ({
  project,
  index,
}: {
  project: Project;
  index: number;
}) => (
  <article id={`work-${project.id}`} className="project-card panel">
    {project.imageUrl ? (
      <div className="project-preview">
        <img
          src={project.imageUrl}
          alt={project.imageAlt || `${project.title} preview`}
          width="1440"
          height="900"
          loading="lazy"
          decoding="async"
        />
        <span className="project-preview-label">
          PROJECT PREVIEW <ArrowUpRight size={13} />
        </span>
      </div>
    ) : (
      project.featured && (
        <div
          className={`project-system-art project-system-art-${index % 2}`}
          aria-hidden="true"
        >
          <div className="system-node">
            <Braces size={28} />
            <span>{project.tags[0] || "Interface"}</span>
          </div>
          <div className="system-connector">
            <i />
            <i />
            <i />
          </div>
          <div className="system-node system-node-core">
            <Network size={34} />
            <span>{project.title}</span>
          </div>
          <div className="system-connector">
            <i />
            <i />
            <i />
          </div>
          <div className="system-node">
            <Database size={28} />
            <span>{project.tags[1] || "Data"}</span>
          </div>
        </div>
      )
    )}
    <div className="card-meta">
      <span>{project.category}</span>
      <span>[MOD: {String(index + 1).padStart(2, "0")}]</span>
    </div>
    <h3>{project.title}</h3>
    <p className="project-description">{project.description}</p>
    <ul className="tags">
      {project.tags.map((tag, i) => (
        <li className="tag" key={i}>
          {tag}
        </li>
      ))}
    </ul>
    <div className="project-links">
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Live demo of ${project.title}`}
        >
          Live Demo <ArrowUpRight size={13} />
        </a>
      )}
      {project.sourceUrl && (
        <a
          href={project.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Source code for ${project.title}`}
        >
          <Github size={13} /> Source
        </a>
      )}
      {project.context && <span>{project.context}</span>}
    </div>
  </article>
);
export default ProjectsSection;
