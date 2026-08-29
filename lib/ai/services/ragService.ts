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

export interface ExtractedUnit {
  title: string;
  subtopics: string[];
  formulas: string[];
}

export interface ExtractedKnowledgeContext {
  summary: string;
  keyTopics: string[];
  keyFormulas: string[];
  units: ExtractedUnit[];
  chunks: SourceChunk[];
  fullTextPreview: string;
}

export class RAGService {
  /**
   * Filter out noisy preamble content from PDF text:
   * - Pages that are nearly empty (< 120 chars after trim)
   * - Sections that are clearly cover/meta: copyright, preface, TOC, acknowledgements
   * - Lines that are just page numbers or running headers
   */
  static filterPDFNoise(rawText: string): string {
    const noiseHeadings = [
      /^(table of contents|contents)\s*$/im,
      /^(copyright|©|all rights reserved)/im,
      /^(preface|foreword|acknowledgements?|dedication)\s*$/im,
      /^(about the author|about this book)\s*$/im,
      /^(index)\s*$/im,
    ];

    const pageSegments = rawText.split(/\f|\n{4,}/);

    const contentPages = pageSegments.filter((segment) => {
      const trimmed = segment.trim();
      if (trimmed.length < 120) return false;
      const firstLines = trimmed.slice(0, 300).toLowerCase();
      for (const noisePattern of noiseHeadings) {
        if (noisePattern.test(firstLines)) return false;
      }
      return true;
    });

    const cleanedPages = contentPages.map((page) => {
      return page
        .split("\n")
        .filter((line) => {
          const t = line.trim();
          if (/^\d+$/.test(t)) return false;
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
      const filteredText = RAGService.filterPDFNoise(rawText);
      return {
        text: filteredText || rawText,
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();
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
   * 3. Deep Structural Extractor: Parses Units, Chapters, Sections, Subtopics, and Formulas from raw text
   */
  static extractDocumentStructure(rawText: string): ExtractedUnit[] {
    const lines = rawText.replace(/\r\n/g, "\n").split("\n");
    const units: ExtractedUnit[] = [];
    let currentUnit: ExtractedUnit | null = null;

    const unitRegex = /^(?:UNIT|MODULE|CHAPTER|PART|SECTION)\s+([IVX0-9]+)[\s\-\—:.]+(.*)/i;
    const sectionHeaderRegex = /^[0-9]+(?:\.[0-9]+)*\s+([A-Z][A-Za-z0-9\s\-\(\)\/\&]{3,60})$/;
    const formulaRegex = /[=≈]|\b(?:exp|log|sin|cos|sqrt|\^|\b[VIRECP]\s*=\s*)/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 3) continue;

      const unitMatch = trimmed.match(unitRegex);
      if (unitMatch) {
        if (currentUnit && (currentUnit.subtopics.length > 0 || currentUnit.formulas.length > 0)) {
          units.push(currentUnit);
        }
        const rawTitle = unitMatch[2]?.trim() || `Unit ${unitMatch[1]}`;
        currentUnit = {
          title: rawTitle.replace(/^[—\-\:\.]\s*/, "").trim() || `Unit ${unitMatch[1]}`,
          subtopics: [],
          formulas: [],
        };
        continue;
      }

      const sectionMatch = trimmed.match(sectionHeaderRegex);
      if (sectionMatch) {
        if (!currentUnit) {
          currentUnit = { title: "Foundations & Core Principles", subtopics: [], formulas: [] };
        }
        currentUnit.subtopics.push(sectionMatch[1].trim());
        continue;
      }

      if (currentUnit) {
        const segments = trimmed.split(/[,;\n•]+/).map((s) => s.trim()).filter((s) => s.length > 2);
        for (const segment of segments) {
          if (formulaRegex.test(segment) && segment.length < 90) {
            if (!currentUnit.formulas.includes(segment)) {
              currentUnit.formulas.push(segment);
            }
          } else if (segment.length >= 3 && segment.length <= 90) {
            const cleanTopic = segment.replace(/^[0-9\.\-\*\•\s]+/, "").trim();
            if (cleanTopic.length >= 3 && !currentUnit.subtopics.includes(cleanTopic)) {
              currentUnit.subtopics.push(cleanTopic);
            }
          }
        }
      }
    }

    if (currentUnit && (currentUnit.subtopics.length > 0 || currentUnit.formulas.length > 0)) {
      units.push(currentUnit);
    }

    return units;
  }

  /**
   * 4. Process raw text into structured semantic context and units
   */
  static processSourceContent(
    sourceTitle: string,
    sourceType: "file" | "url" | "document",
    rawContent: string
  ): ExtractedKnowledgeContext {
    const cleanContent = rawContent.replace(/\r\n/g, "\n").trim();
    const units = RAGService.extractDocumentStructure(cleanContent);
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

    // Collect all topics and formulas from the extracted units
    const keyTopics: string[] = [];
    const keyFormulas: string[] = [];

    if (units.length > 0) {
      units.forEach((u) => {
        keyTopics.push(u.title);
        u.subtopics.slice(0, 4).forEach((st) => {
          if (!keyTopics.includes(st)) keyTopics.push(st);
        });
        u.formulas.forEach((f) => {
          if (!keyFormulas.includes(f)) keyFormulas.push(f);
        });
      });
    } else {
      const headerTopics = cleanContent
        .split("\n")
        .filter((line) => line.trim().startsWith("#") || line.trim().startsWith("- ") || line.trim().startsWith("• "))
        .map((line) => line.replace(/^[#•\-\s]+/, "").trim())
        .filter((t) => t.length > 3 && t.length < 80);

      keyTopics.push(...(headerTopics.length > 0 ? headerTopics.slice(0, 15) : ["Core Foundations", "Applied Principles"]));
    }

    // Build rich text preview for AI
    let fullTextPreview = "";
    if (units.length > 0) {
      fullTextPreview = units
        .map(
          (u, i) =>
            `Unit ${i + 1}: ${u.title}\n  Topics: ${u.subtopics.join(", ")}\n  Formulas: ${u.formulas.join(", ")}`
        )
        .join("\n\n");
    } else {
      fullTextPreview = cleanContent.slice(0, 8000);
    }

    return {
      summary: cleanContent.slice(0, 800) + (cleanContent.length > 800 ? "..." : ""),
      keyTopics: keyTopics.slice(0, 25),
      keyFormulas: keyFormulas.slice(0, 15),
      units,
      chunks,
      fullTextPreview,
    };
  }

  /**
   * 5. AI-Powered Knowledge Distillation (Model 1 Deep RAG)
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
Analyze the source text and distill it into structured learning concepts.

Return ONLY a valid JSON object matching this exact schema:
{
  "summary": "2-3 sentence overview of the syllabus domain",
  "chapters": ["Chapter 1: ...", "Chapter 2: ..."],
  "formulas": ["Formula 1", "Formula 2"],
  "keyTerms": ["Term 1", "Term 2", "Term 3"]
}`;

    const userPrompt = `Course: ${params.courseTitle}
Goal: ${params.learningGoal}

Source Material:
${params.extractedText.slice(0, 8000)}

Distill the core knowledge units from the above source text.`;

    if (!ai) {
      const units = RAGService.extractDocumentStructure(params.extractedText);
      return {
        summary: `Syllabus material for ${params.courseTitle} focused on ${params.learningGoal}.`,
        chapters: units.length > 0 ? units.map((u) => u.title) : ["Core Foundations", "Applied Principles"],
        formulas: units.flatMap((u) => u.formulas),
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
      const units = RAGService.extractDocumentStructure(params.extractedText);
      return {
        summary: `Syllabus material for ${params.courseTitle} focused on ${params.learningGoal}.`,
        chapters: units.length > 0 ? units.map((u) => u.title) : ["Core Foundations", "Applied Principles"],
        formulas: units.flatMap((u) => u.formulas),
        keyTerms: [params.courseTitle, "Fundamentals", "Applications"],
      };
    }
  }
}

