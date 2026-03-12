
import type { ComponentPropsWithoutRef } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const CODE_FENCE_RE = /^```/;
const STANDALONE_PUNCT_RE = /^[.,;:!?]+$/;
const ORPHAN_LINE_RE = /^(?:\(\s*\)[.,;:!?]*|\)[.,;:!?]*|[.,;:!?]+)$/;

const normalizeMarkdown = (content: string) => {
  const text = (content ?? "")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/\u2011|\u2012|\u2013/g, "-")
    .replace(/â€¢/g, "•")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "-")
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€/g, '"');

  const lines = text.split("\n");
  const out: string[] = [];

  let inCodeFence = false;
  let justClosedFence = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, "");
    const trimmed = line.trim();

    if (CODE_FENCE_RE.test(trimmed)) {
      inCodeFence = !inCodeFence;
      justClosedFence = !inCodeFence;
      // Handle malformed closing fence like ```.
      out.push(line.replace(/^(```+)\s*[.,;:!?]+\s*$/g, "$1"));
      continue;
    }

    if (!inCodeFence) {
      if (ORPHAN_LINE_RE.test(trimmed)) {
        continue;
      }
      if (justClosedFence && STANDALONE_PUNCT_RE.test(trimmed)) {
        continue;
      }
    }

    if (trimmed.length > 0 && !STANDALONE_PUNCT_RE.test(trimmed)) {
      justClosedFence = false;
    }

    out.push(line);
  }

  return out.join("\n").trim();
};


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
    p: ({ children }) => <p className="mb-3 leading-7">{children}</p>,
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-2 pl-6 marker:text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-2 pl-6 marker:text-muted-foreground">{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),
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
      const text = Array.isArray(children) ? children.join("") : String(children ?? "");
      const isInlineCode = inline ?? (!className && !text.includes("\n"));

      if (isInlineCode) {
        return (
          <code className="rounded bg-card/40 px-1 py-0.5 font-mono text-[0.85em] text-primary" {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className="my-2 overflow-auto rounded-xl border border-border/60 bg-card/40 p-3">
          <code className={["hljs", className].filter(Boolean).join(" ")} {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };

  return (
    <div className="prose max-w-none text-sm prose-p:my-3 prose-li:my-1 prose-table:text-sm prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {safe}
      </ReactMarkdown>
    </div>
  );
}
