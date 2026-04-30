# 03 — Motion system (the core)

This is the most important spec. Every scroll animation in the site flows from three small components.

## Mental model

There are two animation modes. The same component picks the right mode automatically via React context.

| Mode | Trigger | Used in |
|---|---|---|
| **Viewport mode** | Element enters the viewport (`useInView`) | StandardLayout — long scroll articles |
| **Slide mode** | `scrollYProgress` from the parent `useScroll` hook | PresentationLayout — sticky slides |

**Authors never choose the mode.** The layout provides context; the component reads it.

## Library

`framer-motion` only. Hooks used:

- `useInView(ref, { amount, margin })` — viewport detection
- `useScroll({ target, offset })` — per-section scroll progress (0 → 1)
- `useTransform(motionValue, inputRange, outputRange)` — map progress to animation values
- `useReducedMotion()` — honor OS accessibility setting
- `<motion.div animate={…}>` — viewport-mode transitions
- `<motion.div style={…}>` — slide-mode MotionValue-driven styles

## SlideContext

```tsx
// src/components/motion/SlideContext.tsx
"use client";
import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

export interface SlideContextValue {
  scrollYProgress: MotionValue<number>;
}

export const SlideContext = createContext<SlideContextValue | null>(null);
export const useSlideContext = () => useContext(SlideContext);
```

## PresentationSlide — the sticky-stage

```tsx
// src/components/motion/PresentationSlide.tsx
"use client";
import { useRef } from "react";
import { useScroll } from "framer-motion";
import { SlideContext } from "./SlideContext";

export function PresentationSlide({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);

  // offset: progress = 0 when section top hits viewport bottom
  //         progress = 1 when section bottom hits viewport bottom
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  return (
    <SlideContext.Provider value={{ scrollYProgress }}>
      <section
        ref={ref}
        style={{ height: "170vh", position: "relative", zIndex: index }}
      >
        {/* Sticky viewport-height stage */}
        <div style={{ position: "sticky", top: 0, height: "100vh" }}>
          {children}
        </div>
      </section>
    </SlideContext.Provider>
  );
}
```

This is the entire sticky-scroll trick: native CSS `position: sticky` + `useScroll`.

## Reveal — dual-mode fade/translate

`Reveal` is a thin router: it checks context and delegates to one of two inner components. This keeps React's rules of hooks satisfied (no hooks inside conditionals).

```tsx
// src/components/motion/Reveal.tsx
"use client";
import { useRef } from "react";
import { motion, useInView, useReducedMotion, useTransform, useSpring, type MotionValue } from "framer-motion";
import { useSlideContext } from "./SlideContext";

// Public API — used by MarkdownRenderer
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const slide = useSlideContext();
  if (slide?.scrollYProgress) {
    return <SlideReveal scrollYProgress={slide.scrollYProgress} delay={delay}>{children}</SlideReveal>;
  }
  return <ViewportReveal delay={delay}>{children}</ViewportReveal>;
}

// Viewport mode: fade + slide-up when element enters the viewport
function ViewportReveal({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, margin: "0px 0px -12% 0px" });
  // All hooks called above — early return is safe here
  if (reduced) return <div>{children}</div>;
  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Slide mode: fade + slide-up driven by parent scrollYProgress (0 → 1)
function SlideReveal({
  children, delay, scrollYProgress,
}: { children: React.ReactNode; delay: number; scrollYProgress: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const start = Math.min(delay * 0.5, 0.5);
  const opacity = useTransform(smooth, [start, start + 0.35], [0, 1]);
  const y = useTransform(smooth, [start, start + 0.35], [30, 0]);
  if (reduced) return <div>{children}</div>;
  return <motion.div style={{ opacity, y }}>{children}</motion.div>;
}
```

## Accessibility contract

Every motion component must:

1. Call `useReducedMotion()`. When true, skip transitions — render the final state instantly.
2. Never trap keyboard focus based on scroll position.
3. Never convey information only through animation — text must be readable at rest.

## What authors see

Authors write Markdown. They never import motion components. The layout wires them up.

- `StandardLayout` wraps each rendered block in `<Reveal>`. No context provided → viewport mode.
- `PresentationLayout` wraps each slide in `<PresentationSlide>`. Context provided → slide mode.
