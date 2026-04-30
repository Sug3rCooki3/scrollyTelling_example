"use client";

import { useEffect } from "react";

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true']"));
}

export function StoryScroller({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || isInteractiveTarget(event.target)) {
        return;
      }

      const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-story-step='true']"));

      if (!steps.length) {
        return;
      }

      const viewportMidpoint = window.scrollY + window.innerHeight * 0.5;
      const currentIndex = steps.findIndex((step) => step.offsetTop + step.offsetHeight * 0.5 >= viewportMidpoint);
      const fallbackIndex = currentIndex === -1 ? steps.length - 1 : currentIndex;
      const nextIndex = event.shiftKey ? Math.max(fallbackIndex - 1, 0) : Math.min(fallbackIndex + 1, steps.length - 1);
      const nextStep = steps[nextIndex];

      if (!nextStep) {
        return;
      }

      event.preventDefault();
      nextStep.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <>{children}</>;
}