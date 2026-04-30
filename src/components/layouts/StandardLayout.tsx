import Image from "next/image";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import type { PageData } from "@/lib/content/repository";
import styles from "./StandardLayout.module.css";

const navLinks = [
  { href: "/linux", label: "Linux" },
  { href: "/macos", label: "macOS" },
  { href: "/windows", label: "Windows" },
  { href: "/mobile", label: "Mobile" },
];

export function StandardLayout({ page }: { page: PageData }) {
  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          OS Stories
        </Link>
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      <main>
        {page.frontmatter.heroImage && (
          <div className={styles.hero}>
            <Image
              src={page.frontmatter.heroImage}
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        <article className={styles.body}>
          <p className={styles.kicker}>Operating systems, on scroll</p>
          <h1>{page.frontmatter.title}</h1>
          {page.frontmatter.summary && <p className={styles.summary}>{page.frontmatter.summary}</p>}
          <MarkdownRenderer>{page.content}</MarkdownRenderer>
        </article>
      </main>
    </div>
  );
}
