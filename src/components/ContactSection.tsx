import { ArrowUpRight, Mail } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { usePortfolio } from "@/lib/portfolio-context";
const ContactSection = () => {
  const { profile: p, contact, socialLinks } = usePortfolio();
  return (
    <section
      id="contact"
      className="portfolio-section contact-section"
      aria-labelledby="contact-heading"
    >
      <div className="section-rule">
        <span>05_DISPATCH</span>
        <span>+</span>
      </div>
      <ScrollReveal>
        <div className="contact-panel panel">
          <div className="recruiter-summary">
            <p className="eyebrow">{contact.summaryLabel}</p>
            <p>{contact.summary}</p>
          </div>
          <h2 id="contact-heading">{contact.title}</h2>
          <p>{contact.description}</p>
          <a className="action primary" href={`mailto:${p.email}`}>
            <Mail size={15} /> {p.email}
          </a>
          <div className="directory">
            {socialLinks
              .filter((s) => s.url)
              .map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label} <ArrowUpRight size={12} />
                </a>
              ))}
            {p.resumeUrl && (
              <a href={p.resumeUrl} target="_blank" rel="noopener noreferrer">
                {p.resumeLabel} <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};
export default ContactSection;
