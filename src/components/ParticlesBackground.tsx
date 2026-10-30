// Decorative layers use CSS instead of a continuously running particle engine.
const ParticlesBackground = () => (
  <div className="electric-background" aria-hidden="true">
    <div className="electric-grid" />
    <div className="electric-halo electric-halo-blue" />
    <div className="electric-halo electric-halo-violet" />
    <div className="electric-trace electric-trace-one" />
    <div className="electric-trace electric-trace-two" />
    <div className="electric-stars" />
  </div>
);
export default ParticlesBackground;
