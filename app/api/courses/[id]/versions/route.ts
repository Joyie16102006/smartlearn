import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/courses/[id]/versions?day=N
 * Returns all generated versions for a day's lesson.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id: courseId } = await params;
    const { searchParams } = new URL(req.url);
    const dayParam = searchParams.get("day");
    const dayNumber = dayParam ? parseInt(dayParam, 10) : 1;

    const dayPlan = await prisma.dayPlan.findUnique({
      where: {
        courseId_dayNumber: {
          courseId,
          dayNumber,
        },
      },
      include: {
        lessons: {
          include: {
            versions: {
              select: {
                id: true,
                versionNumber: true,
                generatedByModel: true,
                createdAt: true,
              },
              orderBy: { versionNumber: "desc" },
            },
          },
        },
      },
    });

    const versions = dayPlan?.lessons[0]?.versions || [];
    return NextResponse.json(versions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch versions" }, { status: 500 });
  }
}

