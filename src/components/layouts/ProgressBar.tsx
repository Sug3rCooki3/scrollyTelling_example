"use client";

import { motion, useScroll } from "framer-motion";

export function ProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      style={{
        scaleX: scrollYProgress,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--color-accent, #d76a2f)",
        transformOrigin: "left",
        zIndex: 100,
      }}
    />
  );
}
