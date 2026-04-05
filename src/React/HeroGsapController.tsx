import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const HeroGsapController = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (!prefersReducedMotion) {
        const introTl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        introTl
          .from(".home-hero-intro", {
            y: 34,
            opacity: 0,
            duration: 0.9,
          })
          .from(
            ".home-hero-tech",
            {
              y: 12,
              opacity: 0,
              stagger: 0.055,
              duration: 0.42,
            },
            "-=0.42"
          )
          .from(
            ".home-hero-meta > *",
            {
              y: 22,
              opacity: 0,
              stagger: 0.09,
              duration: 0.54,
            },
            "-=0.28"
          )
          .from(
            ".home-scroll-cue",
            {
              y: 10,
              opacity: 0,
              duration: 0.38,
            },
            "-=0.2"
          );
      }

      const revealTargets = gsap.utils.toArray<HTMLElement>(
        ".skills-marquee, .home-focus-panel, .home-focus-mini"
      );

      revealTargets.forEach((target) => {
        gsap.from(target, {
          y: 28,
          opacity: 0,
          duration: 0.76,
          ease: "power2.out",
          scrollTrigger: {
            trigger: target,
            start: "top 84%",
            once: true,
          },
        });
      });

      if (!prefersReducedMotion) {
        gsap.to(".home-three-wrap", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom top",
            scrub: 0.9,
          },
        });
      }
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
};

export default HeroGsapController;
