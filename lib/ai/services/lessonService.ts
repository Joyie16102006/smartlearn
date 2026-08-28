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

    // ── GENERATE NEW LESSON VERSION VIA AI ──
    const provider = getAIProvider();
    const topics: string[] = JSON.parse(dayPlan.topicsCovered || "[]");

    let generatedMarkdown = "";
    const modelName = provider?.name === "Groq" ? "openai/gpt-oss-120b" : provider?.name || "template-engine";

    if (provider) {
      const systemPrompt = `You are SmartLearn AI — an expert university professor and technical tutor.
Generate comprehensive, highly structured daily lecture notes in clean GitHub-Flavored Markdown.

Strict pedagogical rules:
1. Use ## for main modules, ### for sub-sections.
2. For ALL mathematical equations and formal definitions, use standard LaTeX ($$ on its own line for display equations, $ for inline equations).
3. Include truth tables or state comparison tables using GFM table format.
4. Include clean code / HDL blocks with language tags (e.g. \`\`\`verilog, \`\`\`python).
5. Use > blockquotes for crucial design rules and warnings.
6. Provide references to standard documentation and tutorials using [Link Text](URL).
7. Do NOT wrap output in json or conversational preambles. Output pure markdown only.`;

      const userPrompt = `Generate the full educational lesson for:
Course: ${dayPlan.course.title}
Day ${dayPlan.dayNumber} of ${dayPlan.course.totalDays}: ${dayPlan.title}
Core Concept: ${dayPlan.concept.name}
Topics Covered:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}
${dayPlan.revisionNote ? `\nTargeted Diagnostic Revision to address at start: ${dayPlan.revisionNote}` : ""}

Structure the document with:
- Conceptual introduction
- Mathematical definitions & governing proofs (LaTeX $$)
- Step-by-step example with worked calculations
- Truth table / comparative matrix
- Complete code / HDL module
- Summary & key takeaways`;

      try {
        generatedMarkdown = await provider.generateText(userPrompt, systemPrompt);
      } catch (err) {
        console.warn("AI generation failed in LessonService, using fallback:", err);
      }
    }

    if (!generatedMarkdown.trim()) {
      generatedMarkdown = `## ${dayPlan.title}

Welcome to Day ${dayPlan.dayNumber} of **${dayPlan.course.title}**. This module focuses on the theoretical principles, governing equations, and implementation techniques of **${dayPlan.concept.name}**.

---

### 1. Conceptual Framework & Definition

${dayPlan.concept.description}

### 2. Governing Mathematical Equations

The fundamental mathematical relationship governing this architecture is expressed in standard notation:

$$2^m = N \\implies m = \\log_2(N)$$

$$Y = \\sum_{i=0}^{N-1} m_i \\cdot D_i$$

Where $m$ represents control addresses, $N$ denotes data lines, and $Y$ is the synthesized output channel.

---

### 3. Truth Table & Functional Analysis

| Control Address ($S_1 S_0$) | Decimal Index | Selected Channel | Output State ($Y$) |
|:---:|:---:|:---:|:---:|
| $00$ | $0$ | $D_0$ | $Y = D_0$ |
| $01$ | $1$ | $D_1$ | $Y = D_1$ |
| $10$ | $2$ | $D_2$ | $Y = D_2$ |
| $11$ | $3$ | $D_3$ | $Y = D_3$ |

---

### 4. Implementation & Hardware Description

\`\`\`verilog
module combinational_block (
  input  wire [3:0] D,    // Data inputs
  input  wire [1:0] S,    // Address select
  input  wire       EN,   // Active-low enable
  output reg        Y     // Output channel
);
  always @(*) begin
    if (EN) begin
      Y = 1'b0;
    end else begin
      Y = D[S];
    end
  end
endmodule
\`\`\`

> **Design Rule:** Always verify signal polarity, pull-up resistors, and enable pins before committing to hardware synthesis.
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

