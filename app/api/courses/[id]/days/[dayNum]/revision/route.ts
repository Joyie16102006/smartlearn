import { NextResponse } from "next/server";
import { RevisionService } from "@/lib/ai/services/revisionService";

interface Params {
  params: Promise<{
    id: string;
    dayNum: string;
  }>;
}

/**
 * GET /api/courses/[id]/days/[dayNum]/revision
 * Returns 5-minute active recall revision card for the day.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id: courseId, dayNum } = await params;

    const revision = await RevisionService.getOrCreateRevision({
      courseId,
      dayNumber: parseInt(dayNum, 10),
    });

    return NextResponse.json(revision);
  } catch (error: any) {
    console.error("GET /revision error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch revision" }, { status: 500 });
  }
}

