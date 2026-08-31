import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/courses/[id]
 * Returns full course detail with DAG concepts, day schedule, and current topic.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        concepts: true,
        daysList: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const formatted = {
      id: course.id,
      title: course.title,
      category: course.category,
      goal: course.goal,
      currentLevel: course.currentLevel,
      totalDays: course.totalDays,
      currentDay: course.currentDay,
      progressPercentage: course.progressPercentage,
      minutesPerDay: course.minutesPerDay,
      preferredTime: course.preferredTime,
      currentTopic: course.currentTopic,
      nextSessionTime: course.nextSessionTime,
      nextSessionTopic: course.nextSessionTopic,
      description: course.description,
      materialsCount: course.materialsCount,
      streakDays: course.streakDays,
      concepts: course.concepts.map((cn) => ({
        id: cn.id,
        name: cn.name,
        slug: cn.slug,
        status: cn.status,
        masteryPercentage: cn.masteryPercentage,
        importance: cn.importance,
        difficulty: cn.difficulty,
        estimatedMinutes: cn.estimatedMinutes,
        description: cn.description,
        prerequisites:
          typeof cn.prerequisites === "string"
            ? (() => {
                try {
                  return JSON.parse(cn.prerequisites);
                } catch {
                  return [];
                }
              })()
            : cn.prerequisites || [],
        dependents:
          typeof cn.dependents === "string"
            ? (() => {
                try {
                  return JSON.parse(cn.dependents);
                } catch {
                  return [];
                }
              })()
            : cn.dependents || [],
        keyFormulas:
          typeof cn.keyFormulas === "string"
            ? (() => {
                try {
                  return JSON.parse(cn.keyFormulas);
                } catch {
                  return [];
                }
              })()
            : cn.keyFormulas || [],
        dayAssigned: cn.dayAssigned || undefined,
      })),
      daysList: course.daysList.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        conceptId: d.conceptId,
        status: d.status as "completed" | "current" | "locked",
        topicsCovered:
          typeof d.topicsCovered === "string"
            ? (() => {
                try {
                  return JSON.parse(d.topicsCovered);
                } catch {
                  return [d.topicsCovered];
                }
              })()
            : d.topicsCovered || [],
        durationMinutes: d.durationMinutes,
        quizScore: d.quizScore || undefined,
        hasMistake: d.hasMistake,
        mistakeConcept: d.mistakeConcept || undefined,
        revisionNote: d.revisionNote || undefined,
        sourceLink: d.sourceLinkTitle
          ? {
              title: d.sourceLinkTitle,
              source: d.sourceLinkSource || "Curated Reference",
              url: d.sourceLinkUrl || "",
              duration: d.sourceLinkDuration || "12 mins",
            }
          : undefined,
      })),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch course" }, { status: 500 });
  }
}

/**
 * DELETE /api/courses/[id]
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/courses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete course" }, { status: 500 });
  }
}

