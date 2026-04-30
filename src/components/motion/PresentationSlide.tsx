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
        <div style={{ position: "sticky", top: 0, height: "100vh" }}>{children}</div>
      </section>
    </SlideContext.Provider>
  );
}
