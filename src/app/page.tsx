import type { Metadata } from "next";
import { CombinedStoryLayout } from "@/components/layouts/CombinedStoryLayout";
import { getHomeRepo, getPagesRepo } from "@/lib/content/repository";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomeRepo().getPageBySlug("home");
  return { title: page.frontmatter.seo?.title ?? page.frontmatter.title };
}

export default async function Home() {
  const [page, storyPages] = await Promise.all([
    getHomeRepo().getPageBySlug("home"),
    getPagesRepo().getAllPages(),
  ]);

  return <CombinedStoryLayout introPage={page} storyPages={storyPages} />;
}
