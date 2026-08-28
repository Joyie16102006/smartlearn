import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CurriculumService } from "@/lib/ai/services/curriculumService";
import { RAGService } from "@/lib/ai/services/ragService";

/**
 * GET /api/courses
 * Returns all active courses with live progress and concept stats.
 */
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        concepts: true,
        daysList: {
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      goal: c.goal,
      currentLevel: c.currentLevel,
      totalDays: c.totalDays,
      currentDay: c.currentDay,
      progressPercentage: c.progressPercentage,
      minutesPerDay: c.minutesPerDay,
      preferredTime: c.preferredTime,
      currentTopic: c.currentTopic,
      nextSessionTime: c.nextSessionTime,
      nextSessionTopic: c.nextSessionTopic,
      description: c.description,
      materialsCount: c.materialsCount,
      streakDays: c.streakDays,
      concepts: c.concepts.map((cn) => ({
        id: cn.id,
        name: cn.name,
        slug: cn.slug,
        status: cn.status,
        masteryPercentage: cn.masteryPercentage,
        importance: cn.importance,
        difficulty: cn.difficulty,
        estimatedMinutes: cn.estimatedMinutes,
        description: cn.description,
        prerequisites: [],
        keyFormulas: cn.keyFormulas ? JSON.parse(cn.keyFormulas) : [],
        dayAssigned: cn.dayAssigned || undefined,
      })),
      daysList: c.daysList.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        conceptId: d.conceptId,
        status: d.status as "completed" | "current" | "locked",
        topicsCovered: JSON.parse(d.topicsCovered || "[]"),
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
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch courses" }, { status: 500 });
  }
}

/**
 * POST /api/courses
 * Creates a new course via AI Model 1 & Model 2, and saves it into the database.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, goal, level, totalDays, minutesPerDay, sources, files } = body;

    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      throw new Error("No user found in database. Run database seed first.");
    }

    // 1. Process sources via Model 1 (RAG Service)
    let extractedContext = "";
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const url of sources) {
        const processed = RAGService.processSourceContent(url, "url", `Syllabus reference from ${url}`);
        extractedContext += `\nSource: ${url}\nKey Topics: ${processed.keyTopics.join(", ")}\n`;
      }
    }

    // 2. Generate Curriculum & DAG via Model 2
    const curriculum = await CurriculumService.generateCurriculum({
      title: title || "New Technical Course",
      goal: goal || "Comprehensive mastery of foundational and applied principles",
      level: level || "Intermediate",
      totalDays: Number(totalDays) || 30,
      minutesPerDay: Number(minutesPerDay) || 60,
      sourceContext: extractedContext,
    });

    const courseId = (title || "new-course").toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${Date.now().toString().slice(-4)}`;

    // 3. Save Course in Prisma database
    const course = await prisma.course.create({
      data: {
        id: courseId,
        userId: defaultUser.id,
        title: title || "New Course",
        category: curriculum.category,
        goal: goal || "Achieve complete topic mastery",
        currentLevel: level || "Intermediate",
        totalDays: Number(totalDays) || 30,
        currentDay: 1,
        progressPercentage: 0,
        minutesPerDay: Number(minutesPerDay) || 60,
        preferredTime: "06:00 PM",
        currentTopic: curriculum.daysList[0]?.title || "Foundations",
        nextSessionTime: "Tomorrow at 06:00 PM",
        nextSessionTopic: curriculum.daysList[1]?.title || "Core Architecture",
        description: curriculum.description,
        materialsCount: (sources?.length || 0) + (files?.length || 0) + 1,
        streakDays: 0,
        concepts: {
          create: curriculum.concepts.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            status: c.dayAssigned === 1 ? "current" : "upcoming",
            masteryPercentage: 0,
            importance: c.importance,
            difficulty: c.difficulty,
            estimatedMinutes: c.estimatedMinutes,
            description: c.description,
            dayAssigned: c.dayAssigned,
            keyFormulas: c.keyFormulas ? JSON.stringify(c.keyFormulas) : null,
          })),
        },
        daysList: {
          create: curriculum.daysList.map((d) => ({
            dayNumber: d.dayNumber,
            title: d.title,
            conceptId: d.conceptId,
            status: d.dayNumber === 1 ? "current" : "locked",
            topicsCovered: JSON.stringify(d.topicsCovered),
            durationMinutes: d.durationMinutes,
          })),
        },
      },
      include: {
        concepts: true,
        daysList: true,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: error.message || "Failed to create course" }, { status: 500 });
  }
}

