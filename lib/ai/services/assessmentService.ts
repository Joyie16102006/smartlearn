import { getAIProvider } from "../provider";
import { prisma } from "@/lib/db";

/**
 * Model 5: Assessment & Performance Analysis Service
 *
 * Responsibilities:
 * - Generate diagnostic quizzes testing comprehension & application
 * - Evaluate student answer submissions
 * - Calculate concept-level mastery
 * - Log mistakes into database with likely cause & adaptive recommendations
 * - Trigger concept node turning green (mastered) in database
 * - Schedule adaptive revision for the next day
 */

export interface QuizQuestionDTO {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizEvaluationResult {
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  isMastered: boolean;
  mistakesLogged: number;
  conceptName: string;
  streakDays: number;
}

export class AssessmentService {
  /**
   * Get or generate 3 diagnostic quiz questions for a day.
   */
  static async getOrCreateQuiz(params: {
    courseId: string;
    dayNumber: number;
  }): Promise<{ quizId: string; questions: QuizQuestionDTO[] }> {
    const { courseId, dayNumber } = params;

    const dayPlan = await prisma.dayPlan.findUnique({
      where: {
        courseId_dayNumber: {
          courseId,
          dayNumber,
        },
      },
      include: {
        concept: true,
        quizzes: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!dayPlan) {
      throw new Error(`Day plan not found for course ${courseId}, Day ${dayNumber}`);
    }

    // If quiz already exists with questions, return it
    if (dayPlan.quizzes.length > 0 && dayPlan.quizzes[0].questions.length > 0) {
      const existingQuiz = dayPlan.quizzes[0];
      return {
        quizId: existingQuiz.id,
        questions: existingQuiz.questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          options: JSON.parse(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      };
    }

    // Generate questions via AI
    const provider = getAIProvider();
    let generatedQuestions: Array<{
      questionText: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }> = [];

    if (provider) {
      const systemPrompt = `You are SmartLearn AI Assessment Engine.
Generate exactly 3 multiple choice diagnostic questions to test deep comprehension of the day's concept.
Return strictly valid JSON matching:
{
  "questions": [
    {
      "questionText": "Clear technical question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct and others are false."
    }
  ]
}`;

      const userPrompt = `Generate a 3-question diagnostic quiz for:
Course: ${courseId}
Concept: ${dayPlan.concept.name}
Day ${dayNumber}: ${dayPlan.title}`;

      try {
        const res = await provider.generateJSON<{ questions: typeof generatedQuestions }>(userPrompt, systemPrompt);
        if (res && res.questions && res.questions.length > 0) {
          generatedQuestions = res.questions;
        }
      } catch (err) {
        console.warn("Quiz AI generation fallback:", err);
      }
    }

    if (generatedQuestions.length === 0) {
      generatedQuestions = [
        {
          questionText: `How many select lines (m) are required to build a 64:1 Multiplexer architecture?`,
          options: ["4 select lines", "5 select lines", "6 select lines (since 2⁶ = 64)", "8 select lines"],
          correctIndex: 2,
          explanation: "Applying the rule 2^m = N with N = 64 gives 2^6 = 64, so exactly 6 select lines are required.",
        },
        {
          questionText: `If an active-low Enable input (EN') of a 4:1 MUX is connected to Logic 1 (+5V), what is the output state?`,
          options: [
            "Y always follows data line I₀",
            "Y is disabled and stays at logic 0 (or High-Z)",
            "Y inverts all incoming data channels",
            "The circuit enters an undefined meta-stable state",
          ],
          correctIndex: 1,
          explanation: "Because the enable line is active-low (EN'), applying logic 1 disables the internal AND gates, forcing Y to 0.",
        },
        {
          questionText: `To implement an arbitrary 3-variable logic function F(A,B,C) using a 4:1 MUX with A,B as select lines, what is connected to channel I₀ when minterm m(0)=0 and m(1)=1?`,
          options: ["I₀ = C", "I₀ = C'", "I₀ = 0", "I₀ = 1"],
          correctIndex: 0,
          explanation: "For AB = 00 (channel I₀), minterm 0 is 0 and minterm 1 is 1. When C=0, F=0; when C=1, F=1. Therefore I₀ = C.",
        },
      ];
    }

    // Save Quiz in database
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        dayPlanId: dayPlan.id,
        conceptId: dayPlan.conceptId,
        totalQuestions: generatedQuestions.length,
        questions: {
          create: generatedQuestions.map((q) => ({
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            conceptName: dayPlan.concept.name,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return {
      quizId: quiz.id,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: JSON.parse(q.options),
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    };
  }

  /**
   * Submit quiz answers, evaluate performance, update database mastery, and log mistakes.
   */
  static async submitQuizAnswers(params: {
    quizId: string;
    courseId: string;
    dayNumber: number;
    userAnswers: Record<string, number>; // { questionId: selectedIndex }
  }): Promise<QuizEvaluationResult> {
    const { quizId, courseId, dayNumber, userAnswers } = params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        dayPlan: true,
        concept: true,
        course: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error(`Quiz with id ${quizId} not found`);
    }

    let correctCount = 0;
    const mistakesToLog: Array<{
      questionTitle: string;
      userAnswer: string;
      correctAnswer: string;
      explanation: string;
    }> = [];

    for (const q of quiz.questions) {
      const selectedIndex = userAnswers[q.id];
      const options: string[] = JSON.parse(q.options);

      if (selectedIndex === q.correctIndex) {
        correctCount++;
      } else {
        mistakesToLog.push({
          questionTitle: q.questionText,
          userAnswer: options[selectedIndex] || "No answer provided",
          correctAnswer: options[q.correctIndex],
          explanation: q.explanation,
        });
      }
    }

    const totalQuestions = quiz.questions.length;
    const scorePercentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
    const isMastered = scorePercentage >= 70;

    // 1. Record Quiz Attempt in DB
    await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        scorePercentage,
        totalQuestions,
        correctCount,
        userAnswers: JSON.stringify(userAnswers),
      },
    });

    // 2. Update DayPlan status to completed and record quiz score
    await prisma.dayPlan.update({
      where: { id: quiz.dayPlanId },
      data: {
        status: "completed",
        quizScore: scorePercentage,
        hasMistake: mistakesToLog.length > 0,
        mistakeConcept: mistakesToLog.length > 0 ? quiz.concept.name : null,
      },
    });

    // 3. Update ConceptNode mastery and mark completed (Green) if mastered
    await prisma.conceptNode.update({
      where: { id: quiz.conceptId },
      data: {
        status: isMastered ? "completed" : "current",
        masteryPercentage: Math.max(quiz.concept.masteryPercentage, scorePercentage),
      },
    });

    // 4. Log individual mistakes into MistakeLog
    for (const m of mistakesToLog) {
      await prisma.mistakeLog.create({
        data: {
          userId: quiz.course.userId,
          courseId: quiz.courseId,
          dayPlanId: quiz.dayPlanId,
          conceptId: quiz.conceptId,
          questionTitle: m.questionTitle,
          userAnswer: m.userAnswer,
          correctAnswer: m.correctAnswer,
          errorType: "Conceptual Application Error",
          severity: "medium",
          likelyCause: `Misapplied theoretical derivation in ${quiz.concept.name}.`,
          adaptiveAction: `Flagged for 5-minute spaced active recall revision in tomorrow's lecture.`,
        },
      });
    }

    // 5. If mistakes occurred, inject a revision note into the NEXT day's day plan
    if (mistakesToLog.length > 0) {
      const nextDayNum = dayNumber + 1;
      const nextDay = await prisma.dayPlan.findUnique({
        where: {
          courseId_dayNumber: {
            courseId,
            dayNumber: nextDayNum,
          },
        },
      });

      if (nextDay) {
        await prisma.dayPlan.update({
          where: { id: nextDay.id },
          data: {
            status: nextDay.status === "locked" ? "current" : nextDay.status,
            revisionNote: `Targeted refresher on ${quiz.concept.name}: Focus on ${mistakesToLog[0].questionTitle.slice(0, 80)}.`,
          },
        });
      }
    }

    // 6. Update Course progress percentage & increment user streak
    const completedDaysCount = await prisma.dayPlan.count({
      where: { courseId, status: "completed" },
    });
    const totalDaysCount = await prisma.dayPlan.count({
      where: { courseId },
    });
    const newProgress = Math.round((completedDaysCount / Math.max(1, totalDaysCount)) * 100);

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        progressPercentage: newProgress,
        currentDay: Math.min(totalDaysCount, dayNumber + 1),
        streakDays: { increment: 1 },
      },
    });

    await prisma.user.update({
      where: { id: quiz.course.userId },
      data: {
        streakDays: { increment: 1 },
      },
    });

    // 7. Log User Activity
    await prisma.userActivity.create({
      data: {
        userId: quiz.course.userId,
        courseId,
        activityType: "quiz_completed",
        title: `Completed Day ${dayNumber} Mastery Diagnostic`,
        details: `Scored ${scorePercentage}% in ${quiz.concept.name}`,
        score: scorePercentage,
      },
    });

    return {
      scorePercentage,
      correctCount,
      totalQuestions,
      isMastered,
      mistakesLogged: mistakesToLog.length,
      conceptName: quiz.concept.name,
      streakDays: updatedCourse.streakDays,
    };
  }
}

