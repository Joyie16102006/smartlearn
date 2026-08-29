import { NextResponse } from "next/server";
import { RAGService } from "@/lib/ai/services/ragService";

/**
 * POST /api/courses/ingest
 * Model 1: Ingests uploaded PDF files or URLs and extracts distilled knowledge context
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Case A: Multipart Form Data (Real PDF file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const courseTitle = (formData.get("title") as string) || "Technical Course";
      const learningGoal = (formData.get("goal") as string) || "Comprehensive mastery";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await RAGService.extractFromPDF(buffer);
      const distilled = await RAGService.distillKnowledgeContext({
        courseTitle,
        learningGoal,
        extractedText: extracted.text,
      });

      const chunked = RAGService.processSourceContent(file.name, "file", extracted.text);

      return NextResponse.json({
        success: true,
        source: {
          fileName: file.name,
          numPages: extracted.numPages,
          totalCharacters: extracted.text.length,
        },
        distilled,
        chunksCount: chunked.chunks.length,
      });
    }

    // Case B: JSON Payload (URLs or text)
    const body = await req.json();
    const { url, text, title = "New Course", goal = "Mastery" } = body;

    let rawText = text || "";
    let sourceTitle = "Manual Input";

    if (url) {
      const urlExtracted = await RAGService.extractFromUrl(url);
      rawText = urlExtracted.content;
      sourceTitle = urlExtracted.title;
    }

    const chunked = RAGService.processSourceContent(sourceTitle, url ? "url" : "document", rawText);
    const distilled = await RAGService.distillKnowledgeContext({
      courseTitle: title,
      learningGoal: goal,
      extractedText: rawText,
    });

    return NextResponse.json({
      success: true,
      source: {
        title: sourceTitle,
        totalCharacters: rawText.length,
      },
      distilled,
      chunksCount: chunked.chunks.length,
    });
  } catch (error: any) {
    console.error("POST /api/courses/ingest error:", error);
    return NextResponse.json({ error: error.message || "Model 1 Ingestion failed" }, { status: 500 });
  }
}
