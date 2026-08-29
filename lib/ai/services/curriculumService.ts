import { getAIProvider } from "../provider";

/**
 * Model 2: Curriculum & DAG Knowledge Graph Generator
 *
 * Responsibilities:
 * - Deconstruct subject matter into modular Concept Nodes
 * - Build Directed Acyclic Graph (DAG) with prerequisites
 * - Calibrate difficulty & estimated mastery duration
 * - Partition curriculum into day-wise study schedule
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

export interface GeneratedDayPlan {
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
  daysList: GeneratedDayPlan[];
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
    const safeTotalDays = params.totalDays || 30;
    const safeMinutes = params.minutesPerDay || 60;

    if (provider) {
      const systemPrompt = `You are SmartLearn AI Course Architect.
Generate a structured knowledge graph (DAG) and day-wise schedule for a technical course.
Return ONLY valid JSON matching this schema:
{
  "description": "2-3 sentence overview of what the student will master",
  "category": "Subject Category (e.g. Computer Science, Electrical Engineering, Mathematics)",
  "concepts": [
    {
      "id": "concept-1-id",
      "name": "Concept Title",
      "slug": "concept-slug",
      "importance": "high",
      "difficulty": "Beginner",
      "estimatedMinutes": ${safeMinutes},
      "description": "Concise concept summary",
      "prerequisites": [],
      "keyFormulas": ["Key equation in plain text or LaTeX"],
      "dayAssigned": 1
    }
  ],
  "daysList": [
    {
      "dayNumber": 1,
      "title": "Day 1 Title",
      "conceptId": "concept-1-id",
      "topicsCovered": ["Topic A", "Topic B"],
      "durationMinutes": ${safeMinutes}
    }
  ]
}`;

      const userPrompt = `Build a complete curriculum for:
Course: ${params.title}
Goal: ${params.goal}
Level: ${params.level}
Duration: ${safeTotalDays} days (${safeMinutes} mins/day)
${params.sourceContext ? `Syllabus/PDF Material:\n${params.sourceContext.slice(0, 4000)}` : ""}

Generate 6 to 10 distinct concept nodes with prerequisite dependencies. Provide daily lesson milestones covering the ${safeTotalDays}-day schedule.`;

      try {
        const result = await provider.generateJSON<GeneratedCurriculum>(userPrompt, systemPrompt);
        if (result && result.concepts && result.concepts.length > 0) {
          // Normalize and ensure all days up to safeTotalDays are populated
          const concepts = result.concepts.map((c, i) => ({
            ...c,
            id: c.id || `concept-${i + 1}`,
            slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            importance: c.importance || "high",
            difficulty: c.difficulty || (i === 0 ? "Beginner" : i < conceptsLength(result.concepts) / 2 ? "Intermediate" : "Advanced"),
            estimatedMinutes: c.estimatedMinutes || safeMinutes,
            prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
            keyFormulas: Array.isArray(c.keyFormulas) ? c.keyFormulas : [],
            dayAssigned: c.dayAssigned || Math.min(i * 3 + 1, safeTotalDays),
          }));

          const rawDays = Array.isArray(result.daysList) ? result.daysList : [];
          const daysMap = new Map<number, GeneratedDayPlan>();
          rawDays.forEach((d) => {
            if (d.dayNumber && d.dayNumber <= safeTotalDays) {
              daysMap.set(d.dayNumber, {
                dayNumber: d.dayNumber,
                title: d.title || `Day ${d.dayNumber}: ${params.title}`,
                conceptId: d.conceptId || concepts[0].id,
                topicsCovered: Array.isArray(d.topicsCovered) && d.topicsCovered.length > 0 ? d.topicsCovered : ["Foundations", "Applications"],
                durationMinutes: d.durationMinutes || safeMinutes,
              });
            }
          });

          // Fill any missing days sequentially
          const fullDaysList: GeneratedDayPlan[] = [];
          for (let dayNum = 1; dayNum <= safeTotalDays; dayNum++) {
            if (daysMap.has(dayNum)) {
              fullDaysList.push(daysMap.get(dayNum)!);
            } else {
              const conceptIndex = Math.min(Math.floor(((dayNum - 1) / safeTotalDays) * concepts.length), concepts.length - 1);
              const assignedConcept = concepts[conceptIndex];
              fullDaysList.push({
                dayNumber: dayNum,
                title: `${assignedConcept.name}: Part ${((dayNum - 1) % 3) + 1}`,
                conceptId: assignedConcept.id,
                topicsCovered: [assignedConcept.name, "Analysis & Practice Problems"],
                durationMinutes: safeMinutes,
              });
            }
          }

          return {
            description: result.description || `Comprehensive ${safeTotalDays}-day curriculum for ${params.title}.`,
            category: result.category || "Technical Engineering",
            concepts,
            daysList: fullDaysList,
          };
        }
      } catch (err) {
        console.warn("Nemotron curriculum generator fallback:", err);
      }
    }

    // High-quality fallback template
    const baseSlug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const fallbackConcepts: GeneratedConcept[] = [
      {
        id: `${baseSlug}-foundations`,
        name: "Core Axioms & Foundational Principles",
        slug: "core-axioms",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: safeMinutes,
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
        estimatedMinutes: safeMinutes,
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
        estimatedMinutes: safeMinutes,
        description: `Complex multi-component synthesis, optimization bounds, and practical implementation.`,
        prerequisites: [`${baseSlug}-intermediate-analysis`],
        dayAssigned: Math.min(3, safeTotalDays),
      },
    ];

    const fallbackDays: GeneratedDayPlan[] = Array.from({ length: safeTotalDays }, (_, idx) => {
      const dayNum = idx + 1;
      const conceptIdx = Math.min(Math.floor((idx / safeTotalDays) * fallbackConcepts.length), fallbackConcepts.length - 1);
      const assignedConcept = fallbackConcepts[conceptIdx];

      return {
        dayNumber: dayNum,
        title: `Day ${dayNum}: ${assignedConcept.name} (Unit ${((idx % 3) + 1)})`,
        conceptId: assignedConcept.id,
        topicsCovered: [`${assignedConcept.name} Fundamentals`, "Derivations & Problem Solving", "Practical Implementation"],
        durationMinutes: safeMinutes,
      };
    });

    return {
      description: `Structured, adaptive ${safeTotalDays}-day curriculum for ${params.title}. Designed for ${params.level} level at ${safeMinutes} minutes per day.`,
      category: "Computer Engineering",
      concepts: fallbackConcepts,
      daysList: fallbackDays,
    };
  }
}

function conceptsLength(arr: any[]): number {
  return Array.isArray(arr) ? arr.length : 3;
}
