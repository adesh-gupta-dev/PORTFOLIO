import { usePortfolio } from "@/lib/portfolio-context";
const Footer = () => {
  const { profile } = usePortfolio();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          <span className="status-dot" /> {profile.footerText}{" "}
          <span className="footer-divider">·</span> © {new Date().getFullYear()}{" "}
          {profile.name}
        </p>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
};
export default Footer;
