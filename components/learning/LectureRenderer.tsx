"use client";

/**
 * LectureRenderer
 *
 * Renders AI-generated markdown content with full support for:
 * - LaTeX / KaTeX math (supports both $...$/$$...$$ and \(...\)/\[...\] formats)
 * - Code blocks with language tags and 1-click Copy
 * - GFM tables (truth tables, state tables), blockquotes, headings, lists
 * - Source / video reference links
 * - "Explain" action for formulas and selected text
 */

import React, { ComponentProps, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Sparkles, ExternalLink, Copy, Check } from "lucide-react";

interface LectureRendererProps {
  /** Raw markdown string returned by the AI API */
  content: string;
  /** Called when user clicks "Explain" on a formula or selected text */
  onExplain?: (selectedText: string) => void;
}

/** Preprocess markdown to normalize LaTeX delimiters: \[...\] -> $$...$$, \(...\) -> $...$ */
function normalizeMathDelimiters(md: string): string {
  if (!md) return "";
  return md
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
}

/** Copy-to-clipboard button shown on code blocks */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
      title="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export const LectureRenderer: React.FC<LectureRendererProps> = ({
  content,
  onExplain,
}) => {
  const normalizedContent = useMemo(() => normalizeMathDelimiters(content), [content]);

  return (
    <div className="lecture-body prose-sm max-w-none text-zinc-900">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          /* ── Headings ── */
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-zinc-900 mt-5 mb-2 pb-1.5 border-b border-zinc-200 leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-zinc-900 mt-5 mb-2 pb-1 border-b border-zinc-100 leading-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-zinc-800 mt-4 mb-1.5 leading-snug">
              {children}
            </h3>
          ),

          /* ── Paragraph ── */
          p: ({ children }) => (
            <p className="text-[13px] leading-[1.8] text-zinc-700 mb-3 whitespace-pre-wrap">
              {children}
            </p>
          ),

          /* ── Bold / Strong ── */
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900">{children}</strong>
          ),

          /* ── Italic / Em ── */
          em: ({ children }) => (
            <em className="italic text-zinc-700">{children}</em>
          ),

          /* ── Inline code ── */
          code: (props) => {
            const { children, className } = props as ComponentProps<"code"> & { inline?: boolean };
            const isBlock = className?.startsWith("language-") || String(children).includes("\n");

            if (!isBlock) {
              return (
                <code className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded-sm font-mono text-[12px] text-zinc-900 font-semibold break-words">
                  {children}
                </code>
              );
            }

            return <code className={className}>{children}</code>;
          },

          /* ── Code block (pre) ── */
          pre: ({ children }) => {
            const codeEl = React.Children.toArray(children).find(
              (c) => React.isValidElement(c) && c.type === "code"
            ) as React.ReactElement | undefined;

            const raw = codeEl
              ? String((codeEl.props as { children?: unknown }).children).replace(/\n$/, "")
              : "";

            const langMatch = (codeEl?.props as { className?: string })?.className?.match(
              /language-(\w+)/
            );
            const lang = langMatch?.[1] ?? "code";

            return (
              <div className="my-4 rounded-sm border border-zinc-800 overflow-hidden bg-zinc-950">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    {lang}
                  </span>
                  <div className="flex items-center gap-2">
                    {onExplain && (
                      <button
                        onClick={() => onExplain(raw)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain
                      </button>
                    )}
                    <CopyButton code={raw} />
                  </div>
                </div>
                <pre className="overflow-x-auto text-xs leading-relaxed py-3.5 px-4 text-zinc-200 font-mono m-0">
                  {raw}
                </pre>
              </div>
            );
          },

          /* ── Blockquote (Callouts) ── */
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-zinc-900 bg-zinc-50 px-4 py-3 text-[13px] text-zinc-700 leading-relaxed rounded-r-sm">
              {children}
            </blockquote>
          ),

          /* ── Lists ── */
          ul: ({ children }) => (
            <ul className="my-2 pl-5 space-y-1 list-disc text-[13px] text-zinc-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-5 space-y-1 list-decimal text-[13px] text-zinc-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),

          /* ── Horizontal rule ── */
          hr: () => <hr className="my-5 border-zinc-200" />,

          /* ── Tables (GFM) ── */
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto border border-zinc-200 rounded-sm">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-50 border-b border-zinc-200">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2 text-left text-[11px] font-semibold text-zinc-800 border-r border-zinc-200 last:border-r-0">
              {children}
            </th>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-[11px] font-mono text-zinc-700 border-r border-zinc-100 last:border-r-0">
              {children}
            </td>
          ),

          /* ── Links ── */
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-zinc-900 font-semibold underline underline-offset-2 hover:text-zinc-600 transition-colors"
            >
              {children}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>

      {/* Selectable Explain popover */}
      {onExplain && (
        <SelectionExplainButton onExplain={onExplain} />
      )}
    </div>
  );
};

function SelectionExplainButton({ onExplain }: { onExplain: (text: string) => void }) {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = React.useState("");

  React.useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (text.length > 3 && text.length < 400) {
        const range = sel!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top - 44 + window.scrollY });
        setSelectedText(text);
      } else {
        setPos(null);
        setSelectedText("");
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  if (!pos || !selectedText) return null;

  return (
    <div
      style={{ left: pos.x, top: pos.y, transform: "translateX(-50%)" }}
      className="fixed z-50 animate-in fade-in duration-100"
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onExplain(selectedText);
          setPos(null);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 text-white text-[11px] font-medium shadow-lg border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Sparkles className="w-3 h-3" />
        Explain this
      </button>
    </div>
  );
}
