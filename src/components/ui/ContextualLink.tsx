import Link from "next/link";
import { url } from "@/lib/site-config";

export function ContextualLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return <Link href={url(href)}>{children}</Link>;
}
