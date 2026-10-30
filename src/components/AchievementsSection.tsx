import { ArrowUpRight, GraduationCap, Award, Download } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { usePortfolio } from "@/lib/portfolio-context";
const AchievementsSection = () => {
  const { education, certifications, sections } = usePortfolio();
  const s = sections.education;
  return (
    <section
      id="achievements"
      className="portfolio-section"
      aria-labelledby="education-heading"
    >
      <div className="section-rule">
        <span>04_ACAD</span>
        <span>+</span>
      </div>
      <ScrollReveal>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id="education-heading">{s.title}</h2>
          </div>
          <span className="section-note">{s.note}</span>
        </div>
      </ScrollReveal>
      <div className="credentials-grid">
        {education.map((entry) => {
          const fileType = /\.(pdf|json)(?:[?#]|$)/i
            .exec(entry.credentialUrl)?.[1]
            ?.toLowerCase();
          return (
            <ScrollReveal key={entry.id}>
              <article className="credential panel">
                <p className="card-meta">
                  <GraduationCap size={14} /> Degree program
                </p>
                <h3>{entry.title}</h3>
                <p>{entry.institution}</p>
                {entry.issuer && (
                  <p className="education-university">{entry.issuer}</p>
                )}
                {entry.year && (
                  <p className="education-year">
                    Examination year: {entry.year}
                  </p>
                )}
                <div className="credential-issuer">
                  <span>{entry.description}</span>
                  {entry.status && (
                    <span>
                      <span className="status-dot" /> {entry.status}
                    </span>
                  )}
                </div>
                {entry.credentialUrl && (
                  <a
                    className="action degree-download"
                    href={entry.credentialUrl}
                    download={
                      fileType
                        ? `${entry.id}-degree-certificate.${fileType}`
                        : true
                    }
                    aria-label={`Download ${entry.title} certificate`}
                  >
                    <Download size={15} aria-hidden="true" /> Download degree{" "}
                    {fileType && (
                      <span className="degree-file-type">
                        {fileType.toUpperCase()}
                      </span>
                    )}
                  </a>
                )}
              </article>
            </ScrollReveal>
          );
        })}
        {certifications.length > 0 && (
          <ScrollReveal delay={0.06}>
            <article className="credential panel">
              <p className="card-meta">
                <Award size={14} /> Certifications
              </p>
              <ul className="cert-list">
                {certifications.map((cert) => {
                  const inner = (
                    <>
                      <div className="cert-copy">
                        <h3>{cert.title}</h3>
                        <p>
                          {cert.issuer}
                          {cert.description && ` · ${cert.description}`}
                        </p>
                      </div>
                      {cert.url && (
                        <ArrowUpRight
                          className="cert-arrow"
                          size={16}
                          aria-hidden="true"
                        />
                      )}
                    </>
                  );
                  return (
                    <li className="cert-list-item" key={cert.id}>
                      {cert.url ? (
                        <a
                          className="cert-row cert-link"
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className="cert-row">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};
export default AchievementsSection;
