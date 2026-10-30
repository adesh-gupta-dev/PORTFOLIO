import { ArrowDownRight, ArrowUpRight, FileText, Braces } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-context";
import { useEffect, useRef } from "react";
import { animate, createScope, stagger } from "animejs";
const HeroSection = () => {
  const { profile: p, socialLinks } = usePortfolio();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scope: ReturnType<typeof createScope> | undefined;
    let observer: IntersectionObserver | undefined;
    let entrances: ReturnType<typeof animate>[] = [];
    const finishEntrance = () =>
      entrances.forEach((animation) => animation.revert());
    const setup = () => {
      observer?.disconnect();
      scope?.revert();
      entrances = [];
      if (motion.matches) return;
      scope = createScope({ root: element }).add(() => {
        entrances.push(
          animate(".hero-inner > .hero-enter", {
            opacity: [0.45, 1],
            y: [18, 0],
            duration: 700,
            delay: stagger(55),
            ease: "out(3)",
            onComplete: (animation) => animation.revert(),
          }),
        );
        const visual = element.querySelector<HTMLElement>(".hero-visual");
        if (visual)
          entrances.push(
            animate(visual, {
              opacity: [0.6, 1],
              y: [24, 0],
              scale: [0.985, 1],
              duration: 850,
              delay: 100,
              ease: "out(4)",
              onComplete: (animation) => animation.revert(),
            }),
          );
        const track = element.querySelector<HTMLElement>(
          ".portrait-orbit-track",
        );
        if (track && visual) {
          const orbit = animate(track, {
            rotate: [0, 360],
            duration: 18000,
            ease: "linear",
            loop: true,
            autoplay: false,
          });
          if ("IntersectionObserver" in window) {
            observer = new IntersectionObserver((entries) => {
              if (motion.matches) {
                orbit.pause();
                return;
              }
              if (entries.some((entry) => entry.isIntersecting)) orbit.play();
              else orbit.pause();
            });
            observer.observe(visual);
          } else orbit.play();
        }
      });
    };
    setup();
    motion.addEventListener("change", setup);
    element.addEventListener("focusin", finishEntrance);
    return () => {
      observer?.disconnect();
      scope?.revert();
      motion.removeEventListener("change", setup);
      element.removeEventListener("focusin", finishEntrance);
    };
  }, [p.heroImage, p.heroPortrait]);
  const namePosition = p.greeting.indexOf(p.name);
  return (
    <section
      id="home"
      ref={root}
      className={`hero ${p.heroImage ? "hero-with-artwork" : ""}`}
      aria-labelledby="intro-heading"
    >
      <div className="hero-inner">
        <p className="status-label hero-enter">
          <span className="status-dot" /> {p.status} <span>/</span> {p.location}
        </p>
        <h1 id="intro-heading" className="hero-enter">
          {namePosition >= 0 ? (
            <>
              {p.greeting.slice(0, namePosition)}
              <span className="hero-name">
                {p.name}
                {p.greeting.slice(namePosition + p.name.length)}
              </span>
            </>
          ) : (
            p.greeting
          )}
        </h1>
        <p className="hero-lead hero-enter">{p.introduction}</p>
        <p className="hero-description hero-enter">{p.description}</p>
        <div className="hero-actions hero-enter">
          <a href="#projects" className="action primary">
            {p.projectsLabel} <ArrowDownRight size={16} />
          </a>
          {p.resumeUrl && (
            <a
              href={p.resumeUrl}
              className="action"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText size={15} /> {p.resumeLabel}
            </a>
          )}
        </div>
        <div className="directory hero-enter">
          {socialLinks
            .filter((s) => s.showInHero && s.url)
            .map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{s.prefix}</span> {s.label} <ArrowUpRight size={12} />
              </a>
            ))}
          <a href={`mailto:${p.email}`}>
            <span>mail/</span> {p.email} <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
      {p.heroImage && (
        <figure
          className={`hero-visual hero-enter ${p.heroPortrait ? "hero-portrait" : ""}`}
        >
          <div className="hero-image-frame">
            {p.heroPortrait && (
              <span className="portrait-orbit" aria-hidden="true">
                <span className="portrait-orbit-track" />
              </span>
            )}
            <img
              src={p.heroImage}
              alt={p.heroImageAlt}
              width={p.heroPortrait ? 398 : 960}
              height={p.heroPortrait ? 512 : 960}
              {...{ fetchpriority: "high" }}
              decoding="async"
            />
            {!p.heroPortrait && (
              <div className="core-scan" aria-hidden="true" />
            )}
          </div>
          <div className="hero-visual-header" aria-hidden="true">
            <span className="status-dot" />{" "}
            {p.heroPortrait ? p.name : "ENGINEERING, ENERGIZED"}{" "}
            <span>{p.heroPortrait ? "01 / PROFILE" : "01 / CORE"}</span>
          </div>
          <figcaption>
            <span className="hero-caption-icon">
              <Braces size={21} />
            </span>
            <div>
              <strong>{p.role}</strong>
              <span>Ideas → interfaces → connected systems</span>
            </div>
            <span className="hero-caption-cross" aria-hidden="true">
              +
            </span>
          </figcaption>
        </figure>
      )}
    </section>
  );
};
export default HeroSection;
