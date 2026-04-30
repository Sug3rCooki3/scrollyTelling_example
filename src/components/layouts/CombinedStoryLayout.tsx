import Image from "next/image";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { PresentationSlide } from "@/components/motion/PresentationSlide";
import type { PageData, ParsedSlide } from "@/lib/content/repository";
import { splitSlides } from "@/lib/content/repository";
import { url } from "@/lib/site-config";
import { ProgressBar } from "./ProgressBar";
import { StoryScroller } from "./StoryScroller";
import presentationStyles from "./PresentationLayout.module.css";
import styles from "./CombinedStoryLayout.module.css";

export function CombinedStoryLayout({
  introPage,
  storyPages,
}: {
  introPage: PageData;
  storyPages: PageData[];
}) {
  return (
    <StoryScroller>
      <div className={styles.root}>
        <ProgressBar />
        <nav className={styles.nav}>
          <Link href="#intro" className={styles.brand}>
            OS Stories
          </Link>
          <div className={styles.navLinks}>
            <Link href="#intro">Start</Link>
            {storyPages.map((page) => (
              <Link key={page.slug} href={`#${page.slug}`}>
                {page.frontmatter.title}
              </Link>
            ))}
          </div>
        </nav>

        <main>
          <section id="intro" data-story-step="true" data-testid="chapter-intro" className={styles.introStep}>
            <div className={styles.introCard}>
              <p className={styles.kicker}>One document. One scroll path.</p>
              <h1>{introPage.frontmatter.title}</h1>
              {introPage.frontmatter.summary && <p className={styles.summary}>{introPage.frontmatter.summary}</p>}
              <MarkdownRenderer>{introPage.content}</MarkdownRenderer>
              <p className={styles.hint}>Press Space to move forward. Press Shift+Space to move back.</p>
            </div>
          </section>

          {storyPages.map((page, pageIndex) => (
            <StoryChapter key={page.slug} page={page} pageIndex={pageIndex} />
          ))}
        </main>
      </div>
    </StoryScroller>
  );
}

function StoryChapter({ page, pageIndex }: { page: PageData; pageIndex: number }) {
  const slides = page.frontmatter.layout === "presentation" ? splitSlides(page.content) : [];

  if (page.frontmatter.layout === "presentation") {
    return (
      <>
        <section id={page.slug} data-story-step="true" data-testid={`chapter-${page.slug}`} className={styles.chapterLead}>
          <div className={styles.chapterLeadCard}>
            <p className={styles.chapterEyebrow}>Chapter {pageIndex + 1}</p>
            <h2>{page.frontmatter.title}</h2>
            {page.frontmatter.summary && <p className={styles.chapterSummary}>{page.frontmatter.summary}</p>}
          </div>
        </section>
        {slides.map((slide, slideIndex) => (
          <PresentationSlide
            key={`${page.slug}-${slideIndex}`}
            index={pageIndex * 10 + slideIndex}
            id={slideIndex === 0 ? undefined : `${page.slug}-slide-${slideIndex + 1}`}
            testId={page.slug === "linux" && slideIndex === 0 ? "story-step-linux" : undefined}
          >
            <StorySlide slide={slide} />
          </PresentationSlide>
        ))}
      </>
    );
  }

  return (
    <section id={page.slug} data-story-step="true" data-testid={`chapter-${page.slug}`} className={styles.articleStep}>
      {page.frontmatter.heroImage && (
        <div className={styles.hero}>
          <Image src={url(page.frontmatter.heroImage)} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      )}
      <article className={styles.articleCard}>
        <p className={styles.chapterEyebrow}>Chapter {pageIndex + 1}</p>
        <h2>{page.frontmatter.title}</h2>
        {page.frontmatter.summary && <p className={styles.chapterSummary}>{page.frontmatter.summary}</p>}
        <MarkdownRenderer>{page.content}</MarkdownRenderer>
      </article>
    </section>
  );
}

function StorySlide({ slide }: { slide: ParsedSlide }) {
  if (slide.kind === "bg") {
    return (
      <div className={presentationStyles.slideBg} style={{ backgroundImage: `url(${url(slide.imageUrl!)})` }}>
        <div className={presentationStyles.slideBgContent}>
          <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
        </div>
      </div>
    );
  }

  if (slide.kind === "split" || slide.kind === "split-reverse") {
    return (
      <div className={slide.kind === "split" ? presentationStyles.slideSplit : presentationStyles.slideSplitReverse}>
        <div className={presentationStyles.splitImageWrapper}>
          <Image src={url(slide.imageUrl!)} alt="" fill sizes="50vw" style={{ objectFit: "cover" }} />
        </div>
        <div className={presentationStyles.slideContent}>
          <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
        </div>
      </div>
    );
  }

  return (
    <div className={presentationStyles.slidePlain}>
      <div className={presentationStyles.plainCard}>
        <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
      </div>
    </div>
  );
}