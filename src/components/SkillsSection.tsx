import ScrollReveal from "./ScrollReveal";
import { usePortfolio } from "@/lib/portfolio-context";
const SkillsSection = () => {
  const { skillGroups, sections } = usePortfolio();
  const s = sections.skills;
  return (
    <section
      id="skills"
      className="portfolio-section"
      aria-labelledby="skills-heading"
    >
      <div className="section-rule">
        <span>03_SKILLS</span>
        <span>+</span>
      </div>
      <ScrollReveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id="skills-heading">{s.title}</h2>
          </div>
          <span className="section-note">{s.note}</span>
        </div>
      </ScrollReveal>
      <div className="skill-rows">
        {skillGroups.map((group, index) => (
          <ScrollReveal key={group.id} delay={index * 0.025}>
            <div className="skill-row">
              <h3>{group.title}</h3>
              <ul>
                {group.skills.map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};
export default SkillsSection;
