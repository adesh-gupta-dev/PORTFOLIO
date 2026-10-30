import { useEffect, useRef, type ReactNode } from "react";
import { animate, createScope } from "animejs";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      !element ||
      motion.matches ||
      !("IntersectionObserver" in window) ||
      element.getBoundingClientRect().top < window.innerHeight
    )
      return;

    let scope: ReturnType<typeof createScope> | undefined;
    let revealed = false;
    const finish = () => {
      revealed = true;
      observer.disconnect();
      scope?.revert();
      element.classList.remove("reveal-pending");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (revealed || !entries.some((entry) => entry.isIntersecting)) return;
        revealed = true;
        observer.disconnect();
        scope = createScope({ root: element }).add(() => {
          animate(element, {
            opacity: [0, 1],
            x: [direction === "left" ? -20 : direction === "right" ? 20 : 0, 0],
            y: [direction === "down" ? -18 : direction === "up" ? 18 : 0, 0],
            duration: 650,
            delay: Math.max(0, Math.min(delay * 1000, 180)),
            ease: "out(3)",
            onComplete: (animation) => animation.revert(),
          });
        });
        element.classList.remove("reveal-pending");
      },
      { threshold: 0.06 },
    );

    // Server HTML and the no-JavaScript page start visible. Only offscreen
    // content is prepared for a one-time entrance after hydration.
    element.classList.add("reveal-pending");
    observer.observe(element);
    const preferenceChanged = () => {
      if (motion.matches) finish();
    };
    element.addEventListener("focusin", finish);
    motion.addEventListener("change", preferenceChanged);
    return () => {
      finish();
      element.removeEventListener("focusin", finish);
      motion.removeEventListener("change", preferenceChanged);
    };
  }, [delay, direction]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
};
export default ScrollReveal;
