import { useEffect, useRef, type ReactNode } from "react";
import { waapi } from "animejs/waapi";

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
      !("animate" in Element.prototype) ||
      !("IntersectionObserver" in window)
    )
      return;

    let animation: ReturnType<typeof waapi.animate> | undefined;
    let revealed = false;
    let prepared = false;
    const finish = () => {
      revealed = true;
      observer.disconnect();
      animation?.revert();
      element.classList.remove("reveal-pending");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (revealed) return;
        const entry = entries[0];
        if (!entry) return;
        // The observer batches geometry reads. Avoid measuring and mutating
        // every section synchronously while React hydrates the page.
        if (!prepared) {
          prepared = true;
          if (entry.isIntersecting) {
            revealed = true;
            observer.disconnect();
          } else element.classList.add("reveal-pending");
          return;
        }
        if (!entry.isIntersecting) return;
        revealed = true;
        observer.disconnect();
        const x = direction === "left" ? -20 : direction === "right" ? 20 : 0;
        const y = direction === "down" ? -18 : direction === "up" ? 18 : 0;
        animation = waapi.animate(element, {
          opacity: [0, 1],
          transform: [`translate(${x}px, ${y}px)`, "translate(0px, 0px)"],
          duration: 650,
          delay: Math.max(0, Math.min(delay * 1000, 180)),
          ease: "out(3)",
          onComplete: (animation) => animation.revert(),
        });
        element.classList.remove("reveal-pending");
      },
      { threshold: 0.06 },
    );

    // Server HTML and the no-JavaScript page start visible. Only offscreen
    // content is prepared for a one-time entrance after hydration.
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
