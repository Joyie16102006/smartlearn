import { getAIProvider } from "../provider";

/**
 * Model 1: Source Ingestion & RAG Extraction Engine
 *
 * Responsibilities:
 * - Extract text from uploaded PDF/document files
 * - Parse and scrape syllabus/article URLs and YouTube lecture references
 * - Semantic chunking into optimal context windows
 * - AI Knowledge distillation: Extracts key topics, formulas, prerequisite dependencies
 */

export interface SourceChunk {
  id: string;
  sourceTitle: string;
  sourceType: "file" | "url" | "document";
  content: string;
  chapterOrTopic?: string;
  tokensEstimate: number;
}

export interface ExtractedKnowledgeContext {
  summary: string;
  keyTopics: string[];
  keyFormulas?: string[];
  prerequisites?: string[];
  chunks: SourceChunk[];
}

export class RAGService {
  /**
   * Filter out noisy preamble content from PDF text:
   * - Pages that are nearly empty (< 120 chars after trim)
   * - Sections that are clearly cover/meta: copyright, preface, TOC, acknowledgements
   * - Lines that are just page numbers or running headers
   */
  static filterPDFNoise(rawText: string): string {
    // Heuristic: split the raw PDF text on form-feed or double-newlines > 4
    // Then discard obviously non-content "pages"
    const noiseHeadings = [
      /^(table of contents|contents)\s*$/im,
      /^(copyright|©|all rights reserved)/im,
      /^(preface|foreword|acknowledgements?|dedication)\s*$/im,
      /^(about the author|about this book)\s*$/im,
      /^(index)\s*$/im,
    ];

    // Split into page-like segments on form feed or 4+ consecutive newlines
    const pageSegments = rawText.split(/\f|\n{4,}/);

    const contentPages = pageSegments.filter((segment) => {
      const trimmed = segment.trim();
      // Drop very short pages (cover, blank, or footer-only pages)
      if (trimmed.length < 120) return false;
      // Drop noise-heading-dominated pages
      const firstLines = trimmed.slice(0, 300).toLowerCase();
      for (const noisePattern of noiseHeadings) {
        if (noisePattern.test(firstLines)) return false;
      }
      return true;
    });

    // Within surviving pages, filter out pure page-number lines and very short lines
    const cleanedPages = contentPages.map((page) => {
      return page
        .split("\n")
        .filter((line) => {
          const t = line.trim();
          // Drop lines that are just a number (page numbers)
          if (/^\d+$/.test(t)) return false;
          // Drop lines shorter than 4 chars (noise)
          if (t.length < 4) return false;
          return true;
        })
        .join("\n");
    });

    return cleanedPages.join("\n\n");
  }

  /**
   * 1. Extract text from uploaded PDF buffer (with preamble noise filtering)
   */
  static async extractFromPDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
    try {
      // Dynamic import of pdf-parse for Node.js runtime compatibility
      // @ts-ignore
      const pdfParse = (await import("pdf-parse")).default || (await import("pdf-parse"));
      const data = await pdfParse(buffer);
      const rawText = data.text || "";
      // Apply noise filtering to remove cover/ToC/copyright preamble pages
      const filteredText = RAGService.filterPDFNoise(rawText);
      return {
        text: filteredText || rawText, // fall back to raw if filtering produces nothing
        numPages: data.numpages || 1,
      };
    } catch (error: any) {
      console.warn("PDF Parse fallback / error:", error?.message || error);
      return {
        text: buffer.toString("utf-8").slice(0, 10000),
        numPages: 1,
      };
    }
  }


  /**
   * 2. Extract content from URLs (YouTube links, documentation, web articles)
   */
  static async extractFromUrl(url: string): Promise<{ title: string; content: string }> {
    try {
      const isYouTube = /youtube\.com|youtu\.be/i.test(url);
      if (isYouTube) {
        const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : "video";
        return {
          title: `YouTube Video Lecture (${videoId})`,
          content: `Video Source: ${url}\nSyllabus video lecture reference covering technical concepts and problem derivations.`,
        };
      }

      // Fetch web article with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();
        // Simple HTML text extraction (stripping scripts, styles, and tags)
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();

        return {
          title: url.replace(/^https?:\/\//, "").slice(0, 60),
          content: cleanText.slice(0, 15000),
        };
      }
    } catch (err) {
      console.warn(`URL extraction fallback for ${url}:`, err);
    }

    return {
      title: url.replace(/^https?:\/\//, "").slice(0, 50),
      content: `Reference URL: ${url}\nOnline educational curriculum reference material.`,
    };
  }

  /**
   * 3. Process raw text into semantic learning chunks
   */
  static processSourceContent(
    sourceTitle: string,
    sourceType: "file" | "url" | "document",
    rawContent: string
  ): ExtractedKnowledgeContext {
    const cleanContent = rawContent.replace(/\r\n/g, "\n").trim();
    const paragraphs = cleanContent.split(/\n{2,}/).filter((p) => p.trim().length > 20);

    const chunks: SourceChunk[] = [];
    let currentChunk = "";
    let chunkIndex = 1;

    for (const paragraph of paragraphs) {
      if ((currentChunk + "\n\n" + paragraph).length > 1200) {
        if (currentChunk.trim()) {
          chunks.push({
            id: `chunk-${chunkIndex++}`,
            sourceTitle,
            sourceType,
            content: currentChunk.trim(),
            tokensEstimate: Math.round(currentChunk.length / 4),
          });
        }
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk-${chunkIndex++}`,
        sourceTitle,
        sourceType,
        content: currentChunk.trim(),
        tokensEstimate: Math.round(currentChunk.length / 4),
      });
    }

    // Extract key topic lines (headers or bullets)
    const keyTopics = cleanContent
      .split("\n")
      .filter((line) => line.trim().startsWith("#") || line.trim().startsWith("- ") || line.trim().startsWith("• "))
      .map((line) => line.replace(/^[#•\-\s]+/, "").trim())
      .slice(0, 15);

    return {
      summary: cleanContent.slice(0, 400) + (cleanContent.length > 400 ? "..." : ""),
      keyTopics: keyTopics.length > 0 ? keyTopics : ["Core Foundations", "Theoretical Principles", "Practical Implementations"],
      chunks,
    };
  }

  /**
   * 4. AI-Powered Knowledge Distillation (Model 1 Deep RAG)
   * Uses the configured AI Provider (Gemini / Groq) to extract deep technical context
   */
  static async distillKnowledgeContext(params: {
    courseTitle: string;
    learningGoal: string;
    extractedText: string;
  }): Promise<{
    summary: string;
    chapters: string[];
    formulas: string[];
    keyTerms: string[];
  }> {
    const ai = getAIProvider();

    const systemPrompt = `You are Model 1: The SmartLearn Knowledge & Source Ingestion Engine.
Your task is to analyze raw textbook/syllabus/article content and distill it into structured learning concepts.

Return ONLY a valid JSON object matching this exact schema:
{
  "summary": "2-3 sentence overview of the syllabus domain",
  "chapters": ["Chapter 1: ...", "Chapter 2: ..."],
  "formulas": ["Formula 1", "Formula 2"],
  "keyTerms": ["Term 1", "Term 2", "Term 3"]
}`;

    const userPrompt = `Course: ${params.courseTitle}
Goal: ${params.learningGoal}

Source Material Context:
${params.extractedText.slice(0, 8000)}

Distill the core knowledge units from the above source text.`;

    if (!ai) {
      return {
        summary: `Syllabus material for ${params.courseTitle} focused on ${params.learningGoal}.`,
        chapters: ["Foundational Principles", "Architecture & Logic", "Advanced Synthesis"],
        formulas: [],
        keyTerms: [params.courseTitle, "Fundamentals", "Applications"],
      };
    }

    try {
      const result = await ai.generateJSON<{
        summary: string;
        chapters: string[];
        formulas: string[];
        keyTerms: string[];
      }>(userPrompt, systemPrompt);

      return result;
    } catch (err) {
      console.warn("Model 1 AI distillation fallback:", err);
      return {
        summary: `Syllabus material for ${params.courseTitle} focused on ${params.learningGoal}.`,
        chapters: ["Foundational Principles", "Architecture & Logic", "Advanced Synthesis"],
        formulas: [],
        keyTerms: [params.courseTitle, "Fundamentals", "Applications"],
      };
    }
  }
}
