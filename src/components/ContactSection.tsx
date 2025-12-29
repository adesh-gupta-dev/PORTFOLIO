import { Mail, Github, Linkedin, Instagram, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const socialLinks = [
  {
    name: "GitHub",
    url: "https://github.com/adesh-gupta-dev",
    icon: Github,
  },
  {
    name: "LinkedIn",
    url: "http://www.linkedin.com/in/adesh-gupta-linked-in",
    icon: Linkedin,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/your___adesh/",
    icon: Instagram,
  },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Contact
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Let's Work Together
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            I'm always open to discussing new projects, creative ideas, or
            opportunities to be part of your vision. Feel free to reach out!
          </p>
        </ScrollReveal>

        {/* Email Button */}
        <ScrollReveal delay={0.1}>
          <div className="mb-10">
            <Button
              size="lg"
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-soft hover:shadow-glow"
              onClick={() =>
                (window.location.href = "mailto:adeshgwork@gmail.com")
              }
            >
              <Mail className="mr-2 h-5 w-5" />
              adeshgwork@gmail.com
            </Button>
          </div>
        </ScrollReveal>

        {/* Social Links */}
        <ScrollReveal delay={0.2}>
          <div className="mb-10">
            <p className="text-sm text-muted-foreground mb-4">
              Or connect with me on social media
            </p>
            <div className="flex justify-center gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                  whileHover={{ y: -4, scale: 1.1 }}
                  className="p-4 rounded-xl bg-card shadow-card hover:shadow-soft transition-shadow group"
                  aria-label={social.name}
                >
                  <social.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Quick Message CTA */}
        <ScrollReveal delay={0.3}>
          <motion.div 
            className="p-8 rounded-2xl bg-card shadow-card"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Send className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold">Quick Response</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              I typically respond within 24 hours. Whether you have a question,
              want to collaborate, or just want to say hi—don't hesitate to reach out!
            </p>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ContactSection;
