import { Award, ExternalLink } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const achievements = [
  {
    title: "Foundational C# with Microsoft",
    issuer: "freeCodeCamp",
    url: "https://www.freecodecamp.org/certification/adesh_gupta/foundational-c-sharp-with-microsoft",
    description: "Comprehensive certification covering C# fundamentals and .NET development",
  },
  {
    title: "Python Certification",
    issuer: "GeeksforGeeks",
    url: "https://media.geeksforgeeks.org/courses/certificates/ea0967ccd8ead81d392fc1ee0ee0c6ce.pdf",
    description: "Mastery of fundamental data structures and algorithmic problem-solving",
  },
];

const AchievementsSection = () => {
  return (
    <section id="achievements" className="py-20 px-4 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Achievements
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Certifications & Courses</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Certifications that validate my skills and dedication to continuous learning.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {achievements.map((achievement, index) => (
            <motion.a
              key={index}
              href={achievement.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: index * 0.15,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ y: -4 }}
              className="group p-6 rounded-2xl bg-card shadow-card hover:shadow-soft transition-shadow block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                      {achievement.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-accent font-medium mb-2">{achievement.issuer}</p>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
