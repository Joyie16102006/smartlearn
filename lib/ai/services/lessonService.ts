import { getAIProvider } from "../provider";
import { prisma } from "@/lib/db";

/**
 * Model 3: Daily Lesson Generator Service
 *
 * Responsibilities:
 * - Generate comprehensive educational workspace lesson markdown
 * - Include LaTeX math ($$ and $), code blocks, GFM tables, and source references
 * - Ensure every generation creates an immutable LessonVersion record in the database
 */

export interface LessonGenerationResult {
  markdownContent: string;
  versionNumber: number;
  generatedByModel: string;
  lessonId: string;
}

export class LessonService {
  /**
   * Get or generate a lesson for a specific day.
   * If versionNumber is specified, returns that specific version.
   * If regenerate is true, calls AI and saves a new LessonVersion.
   */
  static async getOrCreateLesson(params: {
    courseId: string;
    dayNumber: number;
    forceRegenerate?: boolean;
    versionNumber?: number;
  }): Promise<LessonGenerationResult> {
    const { courseId, dayNumber, forceRegenerate, versionNumber } = params;

    // Find the day plan in the database
    const dayPlan = await prisma.dayPlan.findUnique({
      where: {
        courseId_dayNumber: {
          courseId,
          dayNumber,
        },
      },
      include: {
        course: true,
        concept: true,
        lessons: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
            },
          },
        },
      },
    });

    if (!dayPlan) {
      throw new Error(`Day plan not found for course ${courseId}, Day ${dayNumber}`);
    }

    let lesson = dayPlan.lessons[0];

    // If lesson doesn't exist in DB, create it
    if (!lesson) {
      lesson = await prisma.lesson.create({
        data: {
          courseId,
          dayPlanId: dayPlan.id,
          conceptId: dayPlan.conceptId,
          currentVersionNumber: 1,
        },
        include: {
          versions: true,
        },
      });
    }

    // If specific version is requested and exists, return it
    if (versionNumber && !forceRegenerate) {
      const requested = lesson.versions.find((v) => v.versionNumber === versionNumber);
      if (requested) {
        return {
          markdownContent: requested.markdownContent,
          versionNumber: requested.versionNumber,
          generatedByModel: requested.generatedByModel,
          lessonId: lesson.id,
        };
      }
    }

    // If existing versions exist and forceRegenerate is false, return latest
    if (lesson.versions.length > 0 && !forceRegenerate) {
      const latest = lesson.versions[0];
      return {
        markdownContent: latest.markdownContent,
        versionNumber: latest.versionNumber,
        generatedByModel: latest.generatedByModel,
        lessonId: lesson.id,
      };
    }

    // ── GENERATE NEW LESSON VERSION VIA AI (Model 3: Gemini 2.5 Flash) ──
    const provider = getAIProvider("model3") || getAIProvider();
    const topics: string[] = JSON.parse(dayPlan.topicsCovered || "[]");
    const studentLevel = dayPlan.course.currentLevel || "Intermediate";

    let generatedMarkdown = "";
    const modelName = provider?.name || "Google Gemini (gemini-2.5-flash)";

    // ── FETCH USER PERFORMANCE MEMORY (last 5 completed days) ──
    let performanceDigest = "";
    try {
      const recentDays = await prisma.dayPlan.findMany({
        where: {
          courseId: dayPlan.courseId,
          dayNumber: { lt: dayPlan.dayNumber },
          status: "completed",
        },
        orderBy: { dayNumber: "desc" },
        take: 5,
        select: {
          dayNumber: true,
          title: true,
          quizScore: true,
          hasMistake: true,
          mistakeConcept: true,
          revisionNote: true,
        },
      });

      if (recentDays.length > 0) {
        const digestLines = recentDays.reverse().map((d) => {
          const scoreTag = d.quizScore !== null
            ? d.quizScore >= 70
              ? `${d.quizScore}% ✓ Mastered`
              : `${d.quizScore}% ✗ Below mastery`
            : "Not attempted";
          const mistakeTag = d.hasMistake && d.mistakeConcept ? ` | Struggled: ${d.mistakeConcept}` : "";
          const revisionTag = d.revisionNote ? ` | Note: ${d.revisionNote}` : "";
          return `  Day ${d.dayNumber} (${d.title}): ${scoreTag}${mistakeTag}${revisionTag}`;
        });
        performanceDigest = `\n--- Student Performance Memory (Last ${recentDays.length} Days) ---\n${digestLines.join("\n")}\n------`;
      }
    } catch (err) {
      console.warn("Could not fetch performance memory:", err);
    }

    if (provider) {
      // Build level-adaptive pedagogical directives
      const levelDirectives = {
        Beginner: `STUDENT LEVEL: BEGINNER
- Define every technical term clearly the first time it is used.
- Use simple analogies and real-world comparisons before introducing mathematical formalism.
- Show all steps in derivations with full algebraic substitutions — never skip steps.
- Worked examples must include unit tracking and complete arithmetic.
- Avoid advanced jargon; if used, immediately explain it in plain language.`,
        Intermediate: `STUDENT LEVEL: INTERMEDIATE
- Assume the student knows basic terminology but needs help connecting theory to application.
- Provide rigorous derivations and show key intermediate algebraic steps.
- Include at least one fully solved numerical example with realistic values.
- Point out common mistakes and boundary condition traps.`,
        Advanced: `STUDENT LEVEL: ADVANCED
- Assume strong domain fundamentals. Focus on derivations, proofs, and edge cases.
- Present formal mathematical rigor with theorem-proof structure where appropriate.
- Compare multiple analytical approaches and discuss their trade-offs.
- Include advanced worked examples with non-trivial parameter choices.
- Connect to research literature, industrial standards, or open problems where relevant.`,
      };

      const levelGuide = levelDirectives[studentLevel as keyof typeof levelDirectives] || levelDirectives.Intermediate;

      const isProgrammingOrCS = /computer science|programming|software|data structures|algorithms|python|java|c\+\+|javascript|react|web dev|backend|frontend/i.test(
        `${dayPlan.course.title} ${dayPlan.course.category || ""}`
      );

      const systemPrompt = `You are SmartLearn AI — a world-class university professor and master tutor across science, engineering, mathematics, and computing.
Your task is to generate a comprehensive, highly rigorous, and crystal-clear daily lecture document in clean GitHub-Flavored Markdown.

${levelGuide}

STRICT CODE BLOCK RULE (MANDATORY):
${isProgrammingOrCS ? "- Provide clean, runnable code examples with language tags (e.g. ```python, ```cpp) and time/space complexity analysis." : "- NEVER include code blocks or programming snippets (NO Python, C++, Verilog, Java, etc.)! This course is a theoretical/applied science or engineering domain. Focus purely on mathematical proofs, governing equations, block diagrams, physical mechanisms, and worked analytical calculations."}

FORMULA & KEYWORD HIGHLIGHTING (CHATGPT STYLE):
1. Use display math ($$ ... $$) on separate lines for ALL primary equations, governing laws, and derivations so they render into clean formula cards.
2. Wrap every single variable, parameter, physical constant, mathematical symbol, and key technical term in \`inline code backticks\` (or inline LaTeX $...$) so they are cleanly highlighted in pill boxes (e.g. \`SNR\`, \`f_c\`, \`\\beta\`, \`Carrier Frequency\`, \`Modulation Index\`).
3. Wrap essential design rules, key takeaways, and critical insights inside > blockquotes so they format into prominent callout boxes.

ANTI-HALLUCINATION GUARD — MANDATORY:
- Only teach concepts, equations, and examples that are genuinely part of the day's stated syllabus.
- Do NOT invent equations, standards, or research references that you are uncertain about.
- If a numerical worked example uses real physical constants (e.g., c = 3×10⁸ m/s, q = 1.6×10⁻¹⁹ C), clearly state their source and units.

FORMATTING RULES:
- Use ## for major section headers, ### for sub-sections.
- Display equations: $$ equation $$ on separate lines.
- Always include at least one complete worked numerical problem with step-by-step substitution and final unit analysis.
- Output pure Markdown only — NO JSON wrappers, NO preambles like "Sure, here is..."`;

      const performanceContext = performanceDigest
        ? `\n${performanceDigest}\nUse this student history to decide whether to briefly recap prerequisites before the new material, and to adjust the depth of examples accordingly.\n`
        : "";

      const userPrompt = `Course: ${dayPlan.course.title}
Subject Category: ${dayPlan.course.category || "Engineering & Applied Sciences"}
Student Knowledge Level: ${studentLevel}
Day ${dayPlan.dayNumber} of ${dayPlan.course.totalDays}: ${dayPlan.title}
Concept Unit: ${dayPlan.concept.name}
Concept Description: ${dayPlan.concept.description}
Today's Specific Topics:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}
${dayPlan.concept.keyFormulas ? `Key Equations from Syllabus: ${dayPlan.concept.keyFormulas}` : ""}
${dayPlan.revisionNote ? `\nPrior Diagnostic Concept to Revisit: ${dayPlan.revisionNote}` : ""}${performanceContext}
Write the full, comprehensive lecture notes covering all of the following:
1. Conceptual Introduction & Intuition (physical/theoretical foundations adapted to ${studentLevel} level)
2. Governing Principles, Proofs & Key Equations (LaTeX $$ for display math cards)
3. Step-by-Step Worked Numerical Problem with Full Calculations and Units
4. Comparative Characteristics / Parameter Analysis Table
5. Real-World Applications, Key Rules & Common Traps (use > blockquotes for important rules)
6. Summary & Key Takeaways`;


      try {
        generatedMarkdown = await provider.generateText(userPrompt, systemPrompt);
      } catch (err) {
        console.warn("AI generation failed in LessonService, using dynamic fallback:", err);
      }
    }

    if (!generatedMarkdown.trim()) {
      generatedMarkdown = `## ${dayPlan.title}

Welcome to Day ${dayPlan.dayNumber} of **${dayPlan.course.title}**. This module provides a comprehensive exploration of **${dayPlan.concept.name}** at the **${studentLevel}** level.

---

### 1. Conceptual Framework & Definition

${dayPlan.concept.description}

### 2. Key Topics for Today

${topics.map((t) => `- **${t}**: Core theory, governing physical/mathematical models, and practical application.`).join("\n")}

### 3. Summary & Analytical Application

Mastery of **${dayPlan.concept.name}** requires a firm grasp of both underlying theoretical principles and practical problem-solving. Review the governing definitions and apply them to standard practice problems.
`;
    }

    const nextVersionNumber = lesson.versions.length + 1;

    // Save the new LessonVersion in database (Never overwrite)
    const newVersion = await prisma.lessonVersion.create({
      data: {
        lessonId: lesson.id,
        versionNumber: nextVersionNumber,
        markdownContent: generatedMarkdown,
        generatedByModel: modelName,
      },
    });

    // Update lesson pointer
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { currentVersionNumber: nextVersionNumber },
    });

    return {
      markdownContent: newVersion.markdownContent,
      versionNumber: newVersion.versionNumber,
      generatedByModel: newVersion.generatedByModel,
      lessonId: lesson.id,
    };
  }
}


