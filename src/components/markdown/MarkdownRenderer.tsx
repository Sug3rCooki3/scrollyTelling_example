import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { ContextualLink } from "@/components/ui/ContextualLink";

export function MarkdownRenderer({ children }: { children: string }) {
  const blocks = children
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  return (
    <div>
      {blocks.map((block, index) => (
        <Reveal key={index} delay={index * 0.04}>
          {renderBlock(block)}
        </Reveal>
      ))}
    </div>
  );
}

function renderBlock(block: string): ReactNode {
  if (block.startsWith("### ")) {
    return <h3>{renderInline(block.slice(4))}</h3>;
  }

  if (block.startsWith("## ")) {
    return <h2>{renderInline(block.slice(3))}</h2>;
  }

  if (block.startsWith("# ")) {
    return <h1>{renderInline(block.slice(2))}</h1>;
  }

  const lines = block.split("\n");
  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <ul>
        {lines.map((line, index) => (
          <li key={index}>{renderInline(line.slice(2))}</li>
        ))}
      </ul>
    );
  }

  return <p>{renderInline(block)}</p>;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!match) {
          return part;
        }

        return (
          <ContextualLink key={index} href={match[2]}>
            {match[1]}
          </ContextualLink>
        );
      })}
    </>
  );
}
