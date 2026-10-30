import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import AchievementsSection from "@/components/AchievementsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import ParticlesBackground from "@/components/ParticlesBackground";
const Index = () => {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    try {
      setIsDark(localStorage.getItem("theme") !== "light");
    } catch {
      /* Keep default when storage is unavailable. */
    }
  }, []);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* Theme works without storage. */
    }
  };
  return (
    <div className="portfolio-site">
      <ParticlesBackground />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />
      <main id="main-content" tabIndex={-1} className="page-container">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <AchievementsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};
export default Index;
