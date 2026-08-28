/**
 * Model 1: Source / RAG Processing Service
 *
 * Responsibilities:
 * - Process uploaded files (PDFs, PPTX, TXT)
 * - Process supplied URLs & web links
 * - Extract and chunk knowledge units
 * - Index content into searchable structured context
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
  chunks: SourceChunk[];
}

export class RAGService {
  /**
   * Process raw text from a document or website into structured learning chunks.
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

    // Extract key topic lines (e.g. lines with headers or bullets)
    const keyTopics = cleanContent
      .split("\n")
      .filter((line) => line.trim().startsWith("#") || line.trim().startsWith("- ") || line.trim().startsWith("• "))
      .map((line) => line.replace(/^[#•\-\s]+/, "").trim())
      .slice(0, 15);

    return {
      summary: cleanContent.slice(0, 300) + "...",
      keyTopics: keyTopics.length > 0 ? keyTopics : ["Core Foundations", "Architecture", "Practical Applications"],
      chunks,
    };
  }
}

