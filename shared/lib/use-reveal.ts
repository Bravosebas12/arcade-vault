import { useEffect, type RefObject } from "react";

/**
 * Adds `in` to every `.reveal` inside the container once it scrolls into view, as in the prototype.
 * Scoped to the container because Cache Components keeps hidden routes in the DOM.
 */
export function useReveal(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    container.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [containerRef]);
}
