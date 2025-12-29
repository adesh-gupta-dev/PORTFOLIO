import { TypeAnimation } from "react-type-animation";
import { ArrowDown, FileText, Github, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Welcome to my portfolio
          </span>
        </div>

        <h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          Hi, I'm{" "}
          <span className="text-gradient">
            <TypeAnimation
              sequence={[
                "Adesh Gupta",
                2000,
                "a Web Developer",
                2000,
                "a Programmer",
                2000,
                "a Tech Enthusiast",
                2000,
              ]}
              wrapper="span"
              speed={30}
              repeat={Infinity}
            />
          </span>
        </h1>

        <p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          I build real, end-to-end applications—not just UI screens. Focused on
          system design, backend logic, and clean frontends with security,
          scalability, and usability in mind.
        </p>

        <div
          className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <Button
            size="lg"
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-soft hover:shadow-glow"
            onClick={() =>
              window.open(
                "https://drive.google.com/file/d/1T6CkE4JhlZgxwOqLjsgYC6TGdncWk0Ai/view?usp=sharing",
                "_blank"
              )
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            View Resume
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="hover:bg-secondary transition-all"
            onClick={() => {
              const el = document.querySelector("#contact");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get in Touch
          </Button>
        </div>

        {/* Social Links */}
        <div
          className="flex justify-center gap-4 mb-12 animate-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          <a
            href="https://github.com/adesh-gupta-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-card hover:bg-secondary transition-all shadow-card hover:scale-110"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="http://www.linkedin.com/in/adesh-gupta-linked-in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-card hover:bg-secondary transition-all shadow-card hover:scale-110"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a
            href="https://www.instagram.com/your___adesh/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-card hover:bg-secondary transition-all shadow-card hover:scale-110"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>

        {/* Scroll Indicator */}
        <div
          className="animate-bounce animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <button
            onClick={() => {
              const el = document.querySelector("#about");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="p-3 rounded-full bg-secondary/50 hover:bg-secondary transition-all"
            aria-label="Scroll down"
          >
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
