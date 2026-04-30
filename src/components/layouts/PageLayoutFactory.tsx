import type { PageData } from "@/lib/content/repository";
import { PresentationLayout } from "./PresentationLayout";
import { StandardLayout } from "./StandardLayout";

export function PageLayoutFactory({ page }: { page: PageData }) {
  if (page.frontmatter.layout === "presentation") {
    return <PresentationLayout page={page} />;
  }

  return <StandardLayout page={page} />;
}
