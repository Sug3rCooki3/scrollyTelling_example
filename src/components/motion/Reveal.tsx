"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useSlideContext } from "./SlideContext";

export function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const slide = useSlideContext();

  if (slide?.scrollYProgress) {
    return (
      <SlideReveal delay={delay} scrollYProgress={slide.scrollYProgress}>
        {children}
      </SlideReveal>
    );
  }

  return <ViewportReveal delay={delay}>{children}</ViewportReveal>;
}

function ViewportReveal({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, margin: "0px 0px -12% 0px" });

  if (reduced) {
    return <div>{children}</div>;
  }

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

function SlideReveal({
  children,
  delay,
  scrollYProgress,
}: {
  children: React.ReactNode;
  delay: number;
  scrollYProgress: MotionValue<number>;
}) {
  const reduced = useReducedMotion();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const start = Math.min(delay * 0.5, 0.5);
  const opacity = useTransform(smooth, [start, start + 0.35], [0, 1]);
  const y = useTransform(smooth, [start, start + 0.35], [30, 0]);

  if (reduced) {
    return <div>{children}</div>;
  }

  return <motion.div style={{ opacity, y }}>{children}</motion.div>;
}
