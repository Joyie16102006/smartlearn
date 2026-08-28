import { NextResponse } from "next/server";
import { AssessmentService } from "@/lib/ai/services/assessmentService";

interface Params {
  params: Promise<{
    id: string;
    dayNum: string;
  }>;
}

/**
 * GET /api/courses/[id]/days/[dayNum]/quiz
 * Retrieves or generates the 3-question diagnostic assessment for the day.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id: courseId, dayNum } = await params;

    const quiz = await AssessmentService.getOrCreateQuiz({
      courseId,
      dayNumber: parseInt(dayNum, 10),
    });

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error("GET /quiz error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch quiz" }, { status: 500 });
  }
}

/**
 * POST /api/courses/[id]/days/[dayNum]/quiz
 * Evaluates student answers, records attempt, turns concept node green if score >= 70%,
 * logs diagnostic mistakes, and increments streaks.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: courseId, dayNum } = await params;
    const { quizId, answers } = await req.json();

    if (!quizId || !answers) {
      return NextResponse.json({ error: "quizId and answers are required" }, { status: 400 });
    }

    const evaluation = await AssessmentService.submitQuizAnswers({
      quizId,
      courseId,
      dayNumber: parseInt(dayNum, 10),
      userAnswers: answers,
    });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("POST /quiz evaluation error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate quiz" }, { status: 500 });
  }
}

