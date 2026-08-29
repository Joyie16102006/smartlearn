import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CurriculumService } from "@/lib/ai/services/curriculumService";
import { RAGService } from "@/lib/ai/services/ragService";

/**
 * GET /api/courses
 * Fetches all courses with full concepts, sources, and day plans from Supabase.
 */
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ courses: [] });
    }

    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      include: {
        concepts: true,
        daysList: {
          orderBy: { dayNumber: "asc" },
        },
        sources: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedCourses = courses.map((c) => ({
      ...c,
      daysList: c.daysList.map((d) => ({
        ...d,
        topicsCovered: typeof d.topicsCovered === "string" ? JSON.parse(d.topicsCovered || "[]") : d.topicsCovered,
      })),
      concepts: c.concepts.map((concept) => ({
        ...concept,
        keyFormulas: typeof concept.keyFormulas === "string" ? JSON.parse(concept.keyFormulas || "[]") : concept.keyFormulas,
        prerequisites: [],
      })),
    }));

    return NextResponse.json({ courses: parsedCourses });
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json({ courses: [], error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/courses
 * Creates a new course via AI Curriculum Engine (Model 1 & 2), and saves it into Supabase.
 * Supports both Multipart FormData (real PDF file uploads) and JSON payloads.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "New Course";
    let goal = "Comprehensive mastery of foundational and applied principles";
    let level = "Intermediate";
    let totalDays = 30;
    let minutesPerDay = 60;
    let sources: string[] = [];
    let extractedContext = "";
    const sourceRecords: Array<{
      type: string;
      title: string;
      url?: string;
      fileName?: string;
      extractedText?: string;
    }> = [];

    // Case A: Multipart Form Data with actual binary files
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") as string) || title;
      goal = (formData.get("goal") as string) || goal;
      level = (formData.get("level") as string) || level;
      totalDays = Number(formData.get("totalDays")) || 30;
      minutesPerDay = Number(formData.get("minutesPerDay")) || 60;

      const rawSources = formData.get("sources") as string;
      if (rawSources) {
        try {
          sources = JSON.parse(rawSources);
        } catch {}
      }

      // Process uploaded binary files (PDFs, PPTX, etc.)
      const files = formData.getAll("files") as File[];
      for (const file of files) {
        if (file && typeof file.name === "string" && file.size > 0) {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const extracted = await RAGService.extractFromPDF(buffer);
            const chunked = RAGService.processSourceContent(file.name, "file", extracted.text);

            extractedContext += `\nDocument: ${file.name} (${extracted.numPages} pages)\nKey Topics: ${chunked.keyTopics.join(", ")}\nSummary:\n${chunked.summary}\n`;

            sourceRecords.push({
              type: "file",
              title: file.name,
              fileName: file.name,
              extractedText: chunked.summary.slice(0, 3000),
            });
          } catch (fileErr) {
            console.warn("Error reading uploaded file:", file.name, fileErr);
            sourceRecords.push({
              type: "file",
              title: file.name,
              fileName: file.name,
              extractedText: `Uploaded syllabus: ${file.name}`,
            });
          }
        }
      }
    } else {
      // Case B: JSON Payload
      const body = await req.json();
      title = body.title || title;
      goal = body.goal || goal;
      level = body.level || level;
      totalDays = Number(body.totalDays) || 30;
      minutesPerDay = Number(body.minutesPerDay) || 60;
      sources = body.sources || [];

      if (body.files && Array.isArray(body.files)) {
        for (const fileName of body.files) {
          if (typeof fileName === "string" && fileName.trim()) {
            extractedContext += `\nUploaded Syllabus Document: ${fileName}\n`;
            sourceRecords.push({
              type: fileName.endsWith(".pdf") ? "file" : "document",
              title: fileName,
              fileName: fileName,
              extractedText: `Uploaded syllabus document: ${fileName}`,
            });
          }
        }
      }
    }

    // Process URLs
    if (sources && Array.isArray(sources)) {
      for (const url of sources) {
        if (typeof url === "string" && url.trim()) {
          const processed = RAGService.processSourceContent(url, "url", `Syllabus reference from ${url}`);
          extractedContext += `\nSource URL: ${url}\nKey Topics: ${processed.keyTopics.join(", ")}\n`;
          sourceRecords.push({
            type: "url",
            title: url.replace(/^https?:\/\//, "").slice(0, 50),
            url: url,
            extractedText: `Key Topics: ${processed.keyTopics.join(", ")}`,
          });
        }
      }
    }

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: "user-default",
          name: "Learner",
          email: "user@smartlearn.ai",
        },
      });
    }

    // 2. Generate Curriculum & DAG via Model 2 (Nemotron 550B)
    const curriculum = await CurriculumService.generateCurriculum({
      title,
      goal,
      level,
      totalDays,
      minutesPerDay,
      sourceContext: extractedContext,
    });

    const courseId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${Date.now().toString().slice(-4)}`;

    // 3. Save Course in Supabase database
    const course = await prisma.course.create({
      data: {
        id: courseId,
        userId: user.id,
        title: title || "New Course",
        category: curriculum.category,
        goal: goal || "Achieve complete topic mastery",
        currentLevel: level || "Intermediate",
        totalDays: totalDays,
        currentDay: 1,
        progressPercentage: 0,
        minutesPerDay: minutesPerDay,
        preferredTime: "06:00 PM",
        currentTopic: curriculum.daysList[0]?.title || "Foundations",
        nextSessionTime: "Tomorrow at 06:00 PM",
        nextSessionTopic: curriculum.daysList[1]?.title || "Core Architecture",
        description: curriculum.description,
        materialsCount: sourceRecords.length || 1,
        streakDays: 0,
        sources: {
          create: sourceRecords.map((s) => ({
            type: s.type,
            title: s.title,
            url: s.url,
            fileName: s.fileName,
            extractedText: s.extractedText,
          })),
        },
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
        sources: true,
      },
    });

    // Update user active courses count in database
    const activeCount = await prisma.course.count({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCoursesCount: activeCount },
    });

    return NextResponse.json({ success: true, id: course.id, course });
  } catch (error: any) {
    console.error("POST /api/courses error:", error);
    return NextResponse.json({ error: error.message || "Course creation failed" }, { status: 500 });
  }
}
