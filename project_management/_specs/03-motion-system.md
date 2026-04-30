# 03 — Motion system (the core)

This is the most important spec. Every scroll animation in the site flows from three small components.

## Implementation status

Status as of 2026-04-30 after QA on **spec 02**:

- Implemented: `SlideContext`, `PresentationSlide`, and `Reveal` are all wired into the app and active on shipped routes.
- Verified locally: `npm run test:e2e` now covers presentation progress-bar presence, progress response to scroll, and reduced-motion rendering on top of the route smoke tests.
- Reduced-motion behavior is implemented in both viewport and slide modes by rendering final-state motion styles immediately instead of relying on animated entry transitions.
- Remaining QA gap: there is still no fine-grained performance benchmark for frame rate or a unit-level test harness for motion hooks.

## Notable implementation details

- `PresentationSlide` uses `zIndex: index + 1` rather than `index` so later slides reliably stack above earlier slides.
- `ProgressBar` is implemented alongside the motion system for presentation pages and is marked `aria-hidden="true"` because it is decorative.
- The reduced-motion branch in `Reveal` keeps the motion tree stable and sets final-state styles immediately, which avoids hydration-time animated markup in reduced-motion mode.

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
        style={{ height: "170vh", position: "relative", zIndex: index + 1 }}
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
  const animate = reduced ? { opacity: 1, y: 0 } : inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 };
  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay };

  return (
    <div ref={ref}>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={animate}
        transition={transition}
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
  if (reduced) return <motion.div style={{ opacity: 1, y: 0 }}>{children}</motion.div>;
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

## Current QA coverage

- Browser coverage in `tests/browser/routes.spec.ts` verifies that presentation pages render the progress bar and that its transform changes as the page scrolls.
- Browser coverage in `tests/browser/routes.spec.ts` also verifies that reduced-motion mode settles article content into final-state styles instead of leaving the initial hidden transform in place.
- Route smoke tests indirectly exercise both motion modes because `windows` renders through viewport mode and `linux`, `macos`, and `mobile` render through slide mode.
