"use client";

/**
 * LectureRenderer
 *
 * Renders AI-generated markdown content with premium typography and ChatGPT-style visual formatting:
 * - High-comfort font sizes (16px base body, prominent headings)
 * - Boxed KaTeX math formulas ($$ ... $$) and inline math pills ($ ... $)
 * - ChatGPT-style inline keyword & code pill boxes
 * - Highlighted callout boxes for blockquotes, design rules, and core insights
 * - High-contrast readable tables and syntax-highlighted code blocks
 * - Interactive "Explain" action for formulas and selected text
 */

import React, { ComponentProps, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Sparkles, ExternalLink, Copy, Check, Info, Lightbulb } from "lucide-react";

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
      className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
      title="Copy code"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export const LectureRenderer: React.FC<LectureRendererProps> = ({
  content,
  onExplain,
}) => {
  const normalizedContent = useMemo(() => normalizeMathDelimiters(content), [content]);

  return (
    <div className="lecture-body font-sans text-zinc-900 antialiased selection:bg-blue-500 selection:text-white">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          /* ── Headings ── */
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mt-9 mb-4 tracking-tight leading-tight pb-3 border-b border-zinc-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-8 mb-3.5 tracking-tight pb-2 border-b border-zinc-100 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mt-6 mb-2.5 tracking-tight">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm sm:text-base font-semibold text-zinc-850 mt-4 mb-2 tracking-tight">
              {children}
            </h4>
          ),

          /* ── Paragraph (Higher comfort font size: 16px) ── */
          p: ({ children }) => (
            <p className="text-[15.5px] sm:text-[16px] leading-[1.85] text-zinc-800 mb-4 font-normal tracking-[-0.01em]">
              {children}
            </p>
          ),

          /* ── Bold / Strong ── */
          strong: ({ children }) => (
            <strong className="font-bold text-zinc-950">{children}</strong>
          ),

          /* ── Italic / Em ── */
          em: ({ children }) => (
            <em className="italic text-zinc-800">{children}</em>
          ),

          /* ── Inline Keywords / Code Pill Boxes (ChatGPT Style) ── */
          code: (props) => {
            const { children, className } = props as ComponentProps<"code"> & { inline?: boolean };
            const isBlock = className?.startsWith("language-") || String(children).includes("\n");

            if (!isBlock) {
              return (
                <code className="px-2 py-0.5 mx-0.5 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-md font-mono text-[13.5px] font-medium inline-block align-middle shadow-2xs hover:bg-zinc-200/60 transition-colors break-words">
                  {children}
                </code>
              );
            }

            return <code className={className}>{children}</code>;
          },

          /* ── Code block (pre) - Only for subjects with actual code ── */
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
              <div className="my-5 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-md">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                      {lang}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onExplain && (
                      <button
                        onClick={() => onExplain(raw)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        Explain
                      </button>
                    )}
                    <CopyButton code={raw} />
                  </div>
                </div>
                <pre className="overflow-x-auto text-[13.5px] leading-relaxed py-4 px-5 text-zinc-200 font-mono m-0">
                  {raw}
                </pre>
              </div>
            );
          },

          /* ── Blockquote (ChatGPT / Notion Highlighted Callout Box) ── */
          blockquote: ({ children }) => (
            <div className="my-5 p-4 sm:p-5 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/20 text-blue-950 shadow-2xs border-l-4 border-l-blue-600 flex items-start gap-3.5">
              <div className="p-1 rounded-md bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1 text-[15px] leading-relaxed text-blue-950 font-normal [&>p]:mb-1 [&>p:last-child]:mb-0">
                {children}
              </div>
            </div>
          ),

          /* ── Lists (Clean spacing & larger font size) ── */
          ul: ({ children }) => (
            <ul className="my-3 pl-6 space-y-2 list-disc text-[15.5px] text-zinc-800 marker:text-zinc-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 pl-6 space-y-2 list-decimal text-[15.5px] text-zinc-800 marker:font-semibold marker:text-zinc-500">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">{children}</li>
          ),

          /* ── Horizontal rule ── */
          hr: () => <hr className="my-7 border-zinc-200/80" />,

          /* ── Tables (GFM Modern Card Style) ── */
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto border border-zinc-200 rounded-xl shadow-2xs bg-white">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-100/90 border-b border-zinc-200 text-zinc-900">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wider text-zinc-800 border-r border-zinc-200 last:border-r-0">
              {children}
            </th>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-[14px] font-mono text-zinc-800 border-r border-zinc-100 last:border-r-0">
              {children}
            </td>
          ),

          /* ── Links ── */
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition-colors"
            >
              {children}
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
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
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg shadow-xl border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        Explain this
      </button>
    </div>
  );
}
