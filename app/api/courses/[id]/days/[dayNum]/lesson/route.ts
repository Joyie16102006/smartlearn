import { NextResponse } from "next/server";
import { LessonService } from "@/lib/ai/services/lessonService";

interface Params {
  params: Promise<{
    id: string;
    dayNum: string;
  }>;
}

/**
 * GET /api/courses/[id]/days/[dayNum]/lesson
 * Retrieves the latest version (or a specific ?v=N version) of the day's lesson from database.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id: courseId, dayNum } = await params;
    const { searchParams } = new URL(req.url);
    const versionParam = searchParams.get("v");
    const versionNumber = versionParam ? parseInt(versionParam, 10) : undefined;

    const result = await LessonService.getOrCreateLesson({
      courseId,
      dayNumber: parseInt(dayNum, 10),
      versionNumber,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /lesson error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch lesson" }, { status: 500 });
  }
}

/**
 * POST /api/courses/[id]/days/[dayNum]/lesson
 * Forces AI regeneration and creates a brand new LessonVersion in the database.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: courseId, dayNum } = await params;

    const result = await LessonService.getOrCreateLesson({
      courseId,
      dayNumber: parseInt(dayNum, 10),
      forceRegenerate: true,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /lesson regeneration error:", error);
    return NextResponse.json({ error: error.message || "Failed to regenerate lesson" }, { status: 500 });
  }
}

