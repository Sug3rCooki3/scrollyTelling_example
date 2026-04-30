import { describe, expect, it } from "vitest";
import { splitSlides } from "@/lib/content/repository";

describe("splitSlides", () => {
  it("parses directives and strips them from markdown", () => {
    const slides = splitSlides(`## One\n\nAlpha\n---\n![bg](/images/hero.jpg)\n## Two\n\nBeta`);

    expect(slides).toEqual([
      { kind: "plain", markdown: "## One\n\nAlpha" },
      { kind: "bg", imageUrl: "/images/hero.jpg", markdown: "## Two\n\nBeta" },
    ]);
  });

  it("keeps unsupported image directives as plain markdown", () => {
    const slides = splitSlides("![poster](/images/poster.jpg)\n## Three");

    expect(slides).toEqual([
      { kind: "plain", markdown: "![poster](/images/poster.jpg)\n## Three" },
    ]);
  });
});
