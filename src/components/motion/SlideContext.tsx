"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

export interface SlideContextValue {
  scrollYProgress: MotionValue<number>;
}

export const SlideContext = createContext<SlideContextValue | null>(null);

export const useSlideContext = () => useContext(SlideContext);
