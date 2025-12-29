import { Heart, Github, Linkedin, Instagram, FileText } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-10 px-4 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left - Brand */}
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-gradient">AG</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">
              Adesh Gupta
            </span>
          </div>

          {/* Center - Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/adesh-gupta-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a
              href="http://www.linkedin.com/in/adesh-gupta-linked-in"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a
              href="https://www.instagram.com/your___adesh/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a
              href="https://drive.google.com/file/d/1T6CkE4JhlZgxwOqLjsgYC6TGdncWk0Ai/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Resume"
            >
              <FileText className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
          </div>

          {/* Right - Copyright */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>&copy; {currentYear}</span>
            <span>Made with</span>
            <Heart className="w-4 h-4 text-destructive fill-current" />
            <span>by Adesh Gupta</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
