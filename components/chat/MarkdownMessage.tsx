"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

function splitCollapsedTableLine(line: string): string[] {
  const normalizeRow = (raw: string) => {
    let row = raw.trim();
    if (!row.startsWith("|")) row = `| ${row}`;
    if (!row.endsWith("|")) row = `${row} |`;

    // Some malformed separator rows start with a bullet before dashes.
    if (/^\|\s*(?:[\u2022\u00B7]|•)\s*[:\-]+(?:\s*\|\s*[:\-]+)+\s*\|\s*$/.test(row)) {
      row = row.replace(/^\|\s*(?:[\u2022\u00B7]|•)\s*/, "| ");
    }

    return row;
  };

  const chunks = line
    .split(/\|\s*\|\s*\|/g)
    .map((c) => c.trim())
    .filter(Boolean);

  if (chunks.length <= 1) return [line];
  return chunks.map(normalizeRow);
}


function convertInlinePipeBlocksToMarkdownTables(text: string) {
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect the inline "||" format you showed:
    // e.g. "| Observation | Insight || | Magnitude | Over 1.46M ... || Trend Check | ..."
    const hasManyPipes = (line.match(/\|/g) ?? []).length >= 6;
    const hasDoublePipes = line.includes("||");
    const hasSeparatorRowNearby =
      line.includes("|---") || line.includes("| ---") || line.includes("|:--");

    if (hasManyPipes && hasDoublePipes && !hasSeparatorRowNearby) {
      // Split into "rows" by ||
      const rawRows = line
        .split("||")
        .map((r) => r.trim())
        .filter(Boolean);

      // Extract cells from each row
      const rows: string[][] = rawRows.map((r) => {
        // ensure it starts/ends with |
        let rr = r;
        if (!rr.startsWith("|")) rr = `| ${rr}`;
        if (!rr.endsWith("|")) rr = `${rr} |`;

        // Split by | and drop empty edges
        const cells = rr
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        return cells;
      });

      // If the first row looks like a header (2 cells), make a table.
      // Otherwise, fallback to a 2-column table anyway.
      const header = rows[0]?.length === 2 ? rows[0] : ["Item", "Details"];
      const body = rows[0]?.length === 2 ? rows.slice(1) : rows;

      // Build proper markdown table
      out.push(`| ${header[0]} | ${header[1]} |`);
      out.push(`|---|---|`);

      for (const r of body) {
        if (r.length >= 2) out.push(`| ${r[0]} | ${r.slice(1).join(" ")} |`);
      }

      out.push(""); // spacing after table
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}

function normalizeMarkdown(input: string) {
  let s = input ?? "";
  s = convertInlinePipeBlocksToMarkdownTables(s);
  // Normalize line endings and special spaces commonly seen in stored responses.
  s = s.replace(/\r\n?/g, "\n");
  s = s.replace(/[\u00A0\u2007\u202F]/g, " ");

  // Normalize punctuation variants that can affect markdown parsing.
  s = s
    .replace(/\u2011/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--");
  s = s.replace(/•/g, "\u2022");

  // Recover malformed bold headings like "Quick Insights**".
  s = s.replace(/^(?!\*\*)([^*\n][^\n]*?)\*\*\s*$/gm, (_m, text) => {
    const t = String(text ?? "").trim();
    return t ? `**${t}**` : "";
  });

  // Normalize <br> variants so they render consistently.
  s = s.replace(/<br\s*\/?>/gi, "<br />");

  // Expand single-line collapsed table blocks where row boundaries were flattened.
  const expandedLines: string[] = [];
  for (const line of s.split("\n")) {
    const trimmed = line.trim();
    const pipeCount = (trimmed.match(/\|/g) ?? []).length;
    const looksCollapsed =
      trimmed.startsWith("|") &&
      (/\|\s*\|\s*\|/.test(line) || /\s+\|\s+\|\s+/.test(line)) &&
      pipeCount >= 8;

    if (looksCollapsed) {
      expandedLines.push(...splitCollapsedTableLine(line));
    } else {
      expandedLines.push(line);
    }
  }
  s = expandedLines.join("\n");

  // Second pass: handle any remaining collapsed table lines.
  s = s
    .split("\n")
    .flatMap((line) => {
      const trimmed = line.trim();
      const pipeCount = (trimmed.match(/\|/g) ?? []).length;
      if (!trimmed.startsWith("|") || pipeCount < 8 || !/\|\s*\|\s*\|/.test(line)) {
        return [line];
      }
      return splitCollapsedTableLine(line);
    })
    .join("\n");

  // Fix malformed single-cell bullet table rows into 2-column rows.
  s = s.replace(/^\|\s*(?:•|[\u2022\u00B7-])\s*(.+?)\s*\|\s*$/gm, (_m, text) => {
    return `|  | \u2022 ${text} |`;
  });

  // Ensure markdown tables start on their own block line.
  const withTableSpacing: string[] = [];
  for (const line of s.split("\n")) {
    const trimmed = line.trim();
    const prev = withTableSpacing[withTableSpacing.length - 1];
    if (
      trimmed.startsWith("|") &&
      prev !== undefined &&
      prev.trim() !== "" &&
      !prev.trim().startsWith("|")
    ) {
      withTableSpacing.push("");
    }
    withTableSpacing.push(line);
  }
  s = withTableSpacing.join("\n");

  // Normalize table separator rows that contain stray spaces or bullets.
  s = s
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      const cleaned = trimmed.replace(
        /^\|\s*(?:[\u2022\u00B7]|•)\s*(?=[:\-]+(?:\s*\|\s*[:\-]+)+\s*\|\s*$)/,
        "| "
      );
      if (/^\|[\s:|-]+\|$/.test(cleaned)) {
        return cleaned.replace(/\s+/g, "");
      }
      return line;
    })
    .join("\n");

  // Keep bullet symbols consistent.
  s = s.replace(/^\s*(?:•|[\u2022\u00B7])\s+/gm, "\u2022 ");

  // Collapse very large blank-space chunks.
  s = s.replace(/\n{3,}/g, "\n\n");

  return s;
}

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "br", "details", "summary", "input"],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    ul: [...(defaultSchema.attributes?.ul ?? []), ["className"]],
    ol: [...(defaultSchema.attributes?.ol ?? []), ["className"]],
    li: [...(defaultSchema.attributes?.li ?? []), ["className"]],
    a: [...(defaultSchema.attributes?.a ?? []), ["target"], ["rel"]],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ["type"],
      ["checked"],
      ["disabled"],
      ["className"],
    ],
  },
};

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

type MarkdownLinkProps = ComponentPropsWithoutRef<"a">;

export default function MarkdownMessage({ content }: { content: string }) {
  const safe = normalizeMarkdown(content);

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mt-3 mb-2 text-xl font-semibold tracking-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-3 mb-2 text-lg font-semibold tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-2 mb-1 text-base font-semibold tracking-tight">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>
    ),
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-border/70 pl-3 text-muted-foreground">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-border/60" />,
    a: ({ href, children, ...props }: MarkdownLinkProps) => {
      const external = !!href && /^(https?:)?\/\//i.test(href);
      return (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
          className="text-primary underline underline-offset-2 hover:opacity-90"
          {...props}
        >
          {children}
        </a>
      );
    },
    input: ({ type, checked }) => {
      if (type !== "checkbox") return null;
      return (
        <input
          type="checkbox"
          checked={!!checked}
          disabled
          readOnly
          className="mr-2 align-middle accent-primary"
        />
      );
    },
    table: ({ children }) => (
      <div className="my-2 overflow-auto rounded-xl border border-border/60">
        <table className="w-full border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-border/60 bg-muted/20 px-3 py-2 text-left font-medium">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-border/30 px-3 py-2 align-top">{children}</td>
    ),
    code: ({ inline, className, children, ...props }: MarkdownCodeProps) => {
      if (inline) {
        return (
          <code className="rounded bg-muted/40 px-1 py-0.5 text-[0.85em]" {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className="my-2 overflow-auto rounded-xl border border-border/60 bg-card/40 p-3">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };

  return (
    <div className="prose max-w-none text-sm prose-p:leading-relaxed prose-table:text-sm dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeHighlight]}
        components={components}
      >
        {safe}
      </ReactMarkdown>
    </div>
  );
}
