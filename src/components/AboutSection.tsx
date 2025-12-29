import { Code, Zap, Shield } from "lucide-react";
import profileImage from "@/assets/profile.png";
import ScrollReveal from "./ScrollReveal";

const highlights = [
  {
    icon: Code,
    title: "Full-Stack Development",
    description: "Building complete applications from frontend to backend",
  },
  {
    icon: Zap,
    title: "Performance Focused",
    description: "Optimizing for speed and scalability",
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Implementing robust security practices",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            About Me
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Passionate Developer & Problem Solver
          </h2>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Profile Image */}
          <ScrollReveal direction="left" className="relative flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-primary p-1 animate-pulse-glow">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  <img 
                    src={profileImage} 
                    alt="Adesh Gupta" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
            </div>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal direction="right" className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Hello! I'm <span className="text-foreground font-semibold">Adesh Gupta</span>, 
              a web developer who builds real, end-to-end applications—not just UI screens. 
              I enjoy working on system design, backend logic, and clean frontends, with a 
              strong focus on security, scalability, and usability.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Always learning, always building. I'm passionate about creating meaningful 
              digital experiences that solve real problems and make a difference.
            </p>

            {/* Highlights */}
            <div className="grid sm:grid-cols-3 gap-4 pt-6">
              {highlights.map((item, index) => (
                <ScrollReveal key={index} delay={0.1 * index}>
                  <div className="p-4 rounded-xl bg-card shadow-card hover:shadow-soft transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
