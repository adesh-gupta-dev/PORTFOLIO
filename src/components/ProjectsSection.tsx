import { ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const projects = [
  {
    title: "Resume Builder",
    description:
      "A responsive web-based resume-builder built with React and Bootstrap, supporting basic to advanced resume templates.",
    liveUrl: "https://resume-builder-adesh-gupta.vercel.app/",
    sourceUrl: "https://github.com/adesh-gupta-dev/Resume-builder",
    tags: ["React", "Bootstrap", "JavaScript"],
  },
  {
    title: "Calculator",
    description:
      "A responsive web-based calculator built with HTML, CSS, and JavaScript, supporting basic arithmetic operations.",
    liveUrl: "https://adesh-gupta-dev.github.io/calculator/",
    sourceUrl: "https://github.com/adesh-gupta-dev/calculator",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "Digital Clock",
    description:
      "A minimalist digital clock built with HTML, CSS, and JavaScript to display real-time updates and styling effects.",
    liveUrl: "https://adesh-gupta-dev.github.io/Digital-Clock/",
    sourceUrl: "https://github.com/adesh-gupta-dev/Digital-Clock",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "Flappy Bird",
    description:
      "A classic side-scroller game clone written in C++, featuring dynamic obstacles and smooth physics-based bird movement.",
    sourceUrl: "https://github.com/adesh-gupta-dev/FLAPPY-BIRD",
    tags: ["C++", "Raylib", "Game Dev"],
  },
  {
    title: "Ping Pong Game",
    description:
      "A two-player ping-pong simulation built with C++, complete with score tracking and realistic paddle control.",
    sourceUrl: "https://github.com/adesh-gupta-dev/PING-PONG-GAME",
    tags: ["C++", "Raylib", "Game Dev"],
  },
  {
    title: "Tic Tac Toe",
    description:
      "A simple Tic-Tac-Toe game using the RAYLIB graphics library in C, featuring a clean interface and win detection.",
    sourceUrl: "https://github.com/adesh-gupta-dev/TIC-TAC-TOE",
    tags: ["C", "Raylib", "Game Dev"],
  },
];

const ProjectsSection = () => {
  return (
    <section id="projects" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Projects
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Featured Work
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A selection of projects that showcase my skills and passion for development.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ y: -8 }}
              className="group p-6 rounded-2xl bg-card shadow-card hover:shadow-soft transition-shadow flex flex-col"
            >
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 flex-grow">
                {project.description}
              </p>

              {/* Links */}
              <div className="flex gap-2 mt-auto">
                {project.liveUrl && (
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={() => window.open(project.liveUrl, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Live Demo
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className={project.liveUrl ? "" : "flex-1"}
                  onClick={() => window.open(project.sourceUrl, "_blank")}
                >
                  <Github className="w-4 h-4 mr-1" />
                  Code
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
