import Image from "next/image";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { PresentationSlide } from "@/components/motion/PresentationSlide";
import type { PageData, ParsedSlide } from "@/lib/content/repository";
import { splitSlides } from "@/lib/content/repository";
import { url } from "@/lib/site-config";
import { ProgressBar } from "./ProgressBar";
import styles from "./PresentationLayout.module.css";

export function PresentationLayout({ page }: { page: PageData }) {
  const slides = splitSlides(page.content);

  return (
    <div className={styles.root}>
      <ProgressBar />
      {slides.map((slide, index) => (
        <PresentationSlide key={`${page.slug}-${index}`} index={index}>
          <SlideStage slide={slide} />
        </PresentationSlide>
      ))}
    </div>
  );
}

function SlideStage({ slide }: { slide: ParsedSlide }) {
  if (slide.kind === "bg") {
    return (
      <div className={styles.slideBg} style={{ backgroundImage: `url(${url(slide.imageUrl!)})` }}>
        <div className={styles.slideBgContent}>
          <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
        </div>
      </div>
    );
  }

  if (slide.kind === "split" || slide.kind === "split-reverse") {
    return (
      <div className={slide.kind === "split" ? styles.slideSplit : styles.slideSplitReverse}>
        <div className={styles.splitImageWrapper}>
          <Image src={url(slide.imageUrl!)} alt="" fill sizes="50vw" style={{ objectFit: "cover" }} />
        </div>
        <div className={styles.slideContent}>
          <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slidePlain}>
      <div className={styles.plainCard}>
        <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
      </div>
    </div>
  );
}
