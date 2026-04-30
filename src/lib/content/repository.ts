import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { PageFrontmatterSchema, type PageFrontmatter } from "./schema";

export interface PageData {
  slug: string;
  frontmatter: PageFrontmatter;
  content: string;
}

export interface ParsedSlide {
  kind: "plain" | "bg" | "split" | "split-reverse";
  imageUrl?: string;
  markdown: string;
}

export class ContentRepository {
  constructor(private readonly baseDir: string) {}

  async getPageBySlug(slug: string): Promise<PageData> {
    const filePath = path.join(this.baseDir, `${slug}.md`);
    const source = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(source);
    const result = PageFrontmatterSchema.safeParse(data);

    if (!result.success) {
      throw new Error(`Invalid frontmatter in ${filePath}: ${result.error.message}`);
    }

    return {
      slug,
      frontmatter: result.data,
      content,
    };
  }

  async getAllSlugs(): Promise<string[]> {
    const files = await fs.readdir(this.baseDir);

    return files
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => fileName.replace(/\.md$/, ""))
      .sort((left, right) => left.localeCompare(right))
      .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug));
  }

  async getAllPages(): Promise<PageData[]> {
    const slugs = await getAllSlugsForRepo(this);
    return Promise.all(slugs.map((slug) => this.getPageBySlug(slug)));
  }
}

async function getAllSlugsForRepo(repository: ContentRepository) {
  return repository.getAllSlugs();
}

export function splitSlides(body: string): ParsedSlide[] {
  return body
    .split(/^---$/m)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((raw) => {
      const imageMatch = raw.match(/^!\[([^\]]+)\]\(([^)]+)\)/);

      if (!imageMatch) {
        return { kind: "plain", markdown: raw };
      }

      const [fullMatch, alt, src] = imageMatch;
      const markdown = raw.replace(fullMatch, "").trim();

      if (alt === "bg") {
        return { kind: "bg", imageUrl: src, markdown };
      }

      if (alt === "split") {
        return { kind: "split", imageUrl: src, markdown };
      }

      if (alt === "split-reverse") {
        return { kind: "split-reverse", imageUrl: src, markdown };
      }

      return { kind: "plain", markdown: raw };
    });
}

export const getHomeRepo = () => new ContentRepository(path.join(process.cwd(), "content"));
export const getPagesRepo = () =>
  new ContentRepository(path.join(process.cwd(), "content/pages"));
