import ScrollReveal from "./ScrollReveal";
import { usePortfolio } from "@/lib/portfolio-context";
const AboutSection = () => {
  const { experience, sections } = usePortfolio();
  const s = sections.experience;
  return (
    <section
      id="about"
      className="portfolio-section"
      aria-labelledby="experience-heading"
    >
      <div className="section-rule">
        <span>01_TRACE</span>
        <span>+</span>
      </div>
      <ScrollReveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id="experience-heading">{s.title}</h2>
          </div>
          <span className="section-note">
            {experience.length} {experience.length === 1 ? "Role" : "Roles"}
            {s.note && ` · ${s.note}`}
          </span>
        </div>
      </ScrollReveal>
      <div className="experience-entries">
        {experience.map((entry, index) => (
          <ScrollReveal key={entry.id}>
            <article className="experience panel">
              <div className="experience-top">
                <div>
                  <p className="card-meta">
                    [ID: EXP_{String(index + 1).padStart(2, "0")}]
                  </p>
                  <h3>{entry.title}</h3>
                  <p className="company">
                    {entry.company}{" "}
                    {entry.context && <span>· {entry.context}</span>}
                  </p>
                </div>
                <p className="experience-date">
                  {entry.period}
                  <br />
                  <span>{entry.location}</span>
                </p>
              </div>
              <ol className="experience-list">
                {entry.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ol>
              {entry.stack.length > 0 && (
                <div className="stack-line">
                  <span>STACK:</span>
                  {entry.stack.map((tag, i) => (
                    <span className="tag" key={i}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};
export default AboutSection;
