import { getAIProvider } from "../provider";

/**
 * Model 2: Curriculum and Knowledge Graph Service
 *
 * Responsibilities:
 * - Analyze all extracted concepts
 * - Identify prerequisites & build DAG relations
 * - Construct day-wise curriculum respecting user's duration and daily minutes
 */

export interface GeneratedConcept {
  id: string;
  name: string;
  slug: string;
  importance: "high" | "medium" | "low";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  description: string;
  prerequisites: string[];
  keyFormulas?: string[];
  dayAssigned: number;
}

export interface GeneratedDay {
  dayNumber: number;
  title: string;
  conceptId: string;
  topicsCovered: string[];
  durationMinutes: number;
}

export interface GeneratedCurriculum {
  description: string;
  category: string;
  concepts: GeneratedConcept[];
  daysList: GeneratedDay[];
}

export class CurriculumService {
  static async generateCurriculum(params: {
    title: string;
    goal: string;
    level: string;
    totalDays: number;
    minutesPerDay: number;
    sourceContext?: string;
  }): Promise<GeneratedCurriculum> {
    const provider = getAIProvider();

    if (provider) {
      const systemPrompt = `You are SmartLearn AI Course Architect.
Generate a comprehensive, pedagogically sound curriculum knowledge graph (DAG) and day-wise schedule.
Return strictly valid JSON matching this schema:
{
  "description": "2-3 sentence overview of the course",
  "category": "e.g. Computer Engineering / Computer Science / Mathematics",
  "concepts": [
    {
      "id": "c-unique-id",
      "name": "Concept Name",
      "slug": "concept-slug",
      "importance": "high" | "medium" | "low",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "estimatedMinutes": 45,
      "description": "Summary of concept and what learner will master",
      "prerequisites": ["c-prereq-id"],
      "keyFormulas": ["LaTeX formula if applicable"],
      "dayAssigned": 1
    }
  ],
  "daysList": [
    {
      "dayNumber": 1,
      "title": "Day Title",
      "conceptId": "c-unique-id",
      "topicsCovered": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
      "durationMinutes": 60
    }
  ]
}`;

      const userPrompt = `Build a complete ${params.totalDays}-day course:
Course Title: ${params.title}
Student Goal: ${params.goal}
Experience Level: ${params.level}
Pacing: ${params.minutesPerDay} minutes per day
${params.sourceContext ? `Source Material / Syllabus Summary:\n${params.sourceContext}` : ""}

Generate between 8 to 15 concept nodes with clear prerequisite dependencies, and assign all ${params.totalDays} days sequentially.`;

      try {
        const result = await provider.generateJSON<GeneratedCurriculum>(userPrompt, systemPrompt);
        if (result && result.concepts && result.concepts.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn("AI Curriculum generator failed, using robust fallback:", err);
      }
    }

    // High-quality fallback template when AI provider is not yet configured
    const safeTotalDays = params.totalDays || 30;
    const baseSlug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const fallbackConcepts: GeneratedConcept[] = [
      {
        id: `${baseSlug}-foundations`,
        name: "Core Axioms & Foundational Principles",
        slug: "core-axioms",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: params.minutesPerDay,
        description: `Fundamental axioms and mathematical underpinnings of ${params.title}.`,
        prerequisites: [],
        keyFormulas: ["E = mc^2", "f(x) = y"],
        dayAssigned: 1,
      },
      {
        id: `${baseSlug}-intermediate-analysis`,
        name: "Systematic Analysis & Methodologies",
        slug: "systematic-analysis",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: params.minutesPerDay,
        description: `Core algorithms, structural frameworks, and reduction techniques in ${params.title}.`,
        prerequisites: [`${baseSlug}-foundations`],
        dayAssigned: Math.min(2, safeTotalDays),
      },
      {
        id: `${baseSlug}-advanced-synthesis`,
        name: "Advanced Synthesis & Implementation",
        slug: "advanced-synthesis",
        importance: "high",
        difficulty: "Advanced",
        estimatedMinutes: params.minutesPerDay,
        description: `Complex multi-component synthesis, optimization bounds, and practical implementation.`,
        prerequisites: [`${baseSlug}-intermediate-analysis`],
        dayAssigned: Math.min(3, safeTotalDays),
      },
    ];

    const fallbackDays: GeneratedDay[] = [];
    for (let i = 1; i <= safeTotalDays; i++) {
      const assignedConcept =
        i <= Math.ceil(safeTotalDays / 3)
          ? fallbackConcepts[0]
          : i <= Math.ceil((2 * safeTotalDays) / 3)
          ? fallbackConcepts[1]
          : fallbackConcepts[2];

      fallbackDays.push({
        dayNumber: i,
        title: `Module ${i}: ${params.title} Exploration Part ${i}`,
        conceptId: assignedConcept.id,
        topicsCovered: [
          `Fundamental derivation & principles of Part ${i}`,
          `Practical implementation step ${i}`,
          `Verification & error analysis`,
        ],
        durationMinutes: params.minutesPerDay || 60,
      });
    }

    return {
      description: `Structured, adaptive ${safeTotalDays}-day curriculum for ${params.title}. Designed for ${params.level} level at ${params.minutesPerDay} minutes per day.`,
      category: "Engineering & Applied Sciences",
      concepts: fallbackConcepts,
      daysList: fallbackDays,
    };
  }
}

