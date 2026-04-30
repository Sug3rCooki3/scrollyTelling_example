import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ContentRepository, splitSlides } from "@/lib/content/repository";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dirPath) => fs.rm(dirPath, { recursive: true, force: true }))
  );
});

async function createTempRepo(files: Record<string, string>) {
  const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), "scrolly-content-"));
  tempDirs.push(dirPath);

  await Promise.all(
    Object.entries(files).map(async ([fileName, content]) => {
      await fs.writeFile(path.join(dirPath, fileName), content, "utf8");
    })
  );

  return new ContentRepository(dirPath);
}

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

describe("ContentRepository", () => {
  it("throws when frontmatter is invalid", async () => {
    const repository = await createTempRepo({
      "broken.md": `---\nlayout: "standard"\n---\n\nMissing a title.`,
    });

    await expect(repository.getPageBySlug("broken")).rejects.toThrow(/Invalid frontmatter/);
  });

  it("propagates missing file errors", async () => {
    const repository = await createTempRepo({});

    await expect(repository.getPageBySlug("missing")).rejects.toThrow(/missing\.md/);
  });

  it("filters non-kebab markdown slugs", async () => {
    const repository = await createTempRepo({
      "linux.md": "---\ntitle: \"Linux\"\nlayout: \"presentation\"\n---\n",
      "Bad Name.md": "---\ntitle: \"Bad\"\nlayout: \"standard\"\n---\n",
      "windows.txt": "ignored",
    });

    await expect(repository.getAllSlugs()).resolves.toEqual(["linux"]);
  });
});
