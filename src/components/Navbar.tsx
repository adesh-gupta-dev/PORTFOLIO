import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { usePortfolio } from "@/lib/portfolio-context";
interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}
const Navbar = ({ isDark, onToggleTheme }: NavbarProps) => {
  const { profile, sections } = usePortfolio();
  const links = [
    { href: "#home", label: "About" },
    { href: "#about", label: sections.experience.navLabel },
    { href: "#projects", label: sections.projects.navLabel },
    { href: "#skills", label: sections.skills.navLabel },
    { href: "#achievements", label: sections.education.navLabel },
    { href: "#contact", label: "Contact" },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-10% 0px -55% 0px" },
    );
    [
      "#home",
      "#about",
      "#projects",
      "#skills",
      "#achievements",
      "#contact",
    ].forEach((href) => {
      const section = document.querySelector(href);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    const media = window.matchMedia("(min-width: 900px)");
    const resize = () => {
      if (media.matches) setIsOpen(false);
    };
    window.addEventListener("keydown", close);
    media.addEventListener("change", resize);
    return () => {
      window.removeEventListener("keydown", close);
      media.removeEventListener("change", resize);
    };
  }, [isOpen]);
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#home" className="brand" onClick={() => setIsOpen(false)}>
          <span>~/</span> {profile.name}{" "}
          <span className="brand-tag">portfolio</span>
        </a>
        <nav aria-label="Main navigation" className="desktop-nav">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "location" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          {profile.resumeUrl && (
            <a
              className="resume-link"
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume <ArrowUpRight size={12} />
            </a>
          )}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button
            ref={toggleRef}
            className="menu-toggle"
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={`mobile-nav ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
};
export default Navbar;
