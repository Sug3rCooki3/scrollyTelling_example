import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayoutFactory } from "@/components/layouts/PageLayoutFactory";
import { getPagesRepo } from "@/lib/content/repository";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getPagesRepo().getAllSlugs();
  return slugs.map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const joinedSlug = slug.join("/");
  const page = await getPagesRepo().getPageBySlug(joinedSlug);
  return { title: page.frontmatter.seo?.title ?? page.frontmatter.title };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  if (!slug?.length) {
    notFound();
  }

  const joinedSlug = slug.join("/");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(joinedSlug)) {
    notFound();
  }

  const page = await getPagesRepo().getPageBySlug(joinedSlug);
  return <PageLayoutFactory page={page} />;
}
