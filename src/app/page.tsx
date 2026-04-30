import type { Metadata } from "next";
import { PageLayoutFactory } from "@/components/layouts/PageLayoutFactory";
import { getHomeRepo } from "@/lib/content/repository";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomeRepo().getPageBySlug("home");
  return { title: page.frontmatter.seo?.title ?? page.frontmatter.title };
}

export default async function Home() {
  const page = await getHomeRepo().getPageBySlug("home");
  return <PageLayoutFactory page={page} />;
}
