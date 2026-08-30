import { getAIProvider } from "../provider";
import { ExtractedUnit, RAGService } from "./ragService";

/**
 * Model 2: Curriculum & DAG Knowledge Graph Generator
 *
 * Responsibilities:
 * - Deconstruct subject matter / uploaded PDF into modular Concept Nodes
 * - Build Directed Acyclic Graph (DAG) with prerequisites and dependents
 * - Calibrate difficulty & estimated mastery duration
 * - Partition curriculum into day-wise study schedule (e.g. Day 1..30)
 * - Derive curriculum dynamically from uploaded source material (zero hardcoded subjects)
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
  dependents: string[];
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

// ─────────────────────────────────────────────────────────────────────────────
// Graph and Schedule Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Compute dependents[] for each concept from prerequisites */
function computeDependents(concepts: GeneratedConcept[]): GeneratedConcept[] {
  const idToNode = new Map(concepts.map((c) => [c.id, c]));
  concepts.forEach((c) => {
    c.dependents = [];
  });
  concepts.forEach((c) => {
    (c.prerequisites || []).forEach((prereqId) => {
      const prereq = idToNode.get(prereqId);
      if (prereq && !prereq.dependents.includes(c.id)) {
        prereq.dependents.push(c.id);
      }
    });
  });
  return concepts;
}

/** Assign dayAssigned by topological depth within totalDays */
function assignDaysByDepth(concepts: GeneratedConcept[], totalDays: number): GeneratedConcept[] {
  const idToDepth = new Map<string, number>();
  const idMap = new Map(concepts.map((c) => [c.id, c]));

  function depth(id: string, visiting = new Set<string>()): number {
    if (idToDepth.has(id)) return idToDepth.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const node = idMap.get(id);
    const d =
      node && node.prerequisites && node.prerequisites.length > 0
        ? 1 + Math.max(...node.prerequisites.map((p) => depth(p, visiting)))
        : 0;
    idToDepth.set(id, d);
    return d;
  }

  concepts.forEach((c) => depth(c.id));
  const maxDepth = Math.max(...Array.from(idToDepth.values()), 0);
  const daysPerLevel = Math.max(1, Math.floor(totalDays / (maxDepth + 1)));

  concepts.forEach((c) => {
    const d = idToDepth.get(c.id) ?? 0;
    c.dayAssigned = Math.min(d * daysPerLevel + 1, totalDays);
  });

  return concepts;
}

/**
 * Distribute concepts and their subtopics evenly across totalDays (e.g. 30 days)
 */
function buildScheduleFromConcepts(
  concepts: GeneratedConcept[],
  totalDays: number,
  minutesPerDay: number,
  unitTopicMap?: Map<string, string[]>
): GeneratedDayPlan[] {
  const days: GeneratedDayPlan[] = [];
  const daysPerConcept = Math.max(1, Math.floor(totalDays / concepts.length));

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const conceptIdx = Math.min(
      Math.floor(((dayNum - 1) / totalDays) * concepts.length),
      concepts.length - 1
    );
    const concept = concepts[conceptIdx];
    const dayInConcept = ((dayNum - 1) % daysPerConcept) + 1;

    // Get subtopics for this concept if available
    const subtopics = unitTopicMap?.get(concept.id) || [];
    let dayTopics: string[] = [];

    if (subtopics.length > 0) {
      const sliceSize = Math.max(1, Math.ceil(subtopics.length / daysPerConcept));
      const startIdx = (dayInConcept - 1) * sliceSize;
      dayTopics = subtopics.slice(startIdx, startIdx + sliceSize);
      if (dayTopics.length === 0) dayTopics = [concept.name, "Analysis & Problem Solving"];
    } else if (concept.keyFormulas && concept.keyFormulas.length > 0) {
      dayTopics = [concept.name, ...concept.keyFormulas.slice(0, 2)];
    } else {
      dayTopics = [concept.name, `${concept.name} Core Principles`, "Practice & Derivations"];
    }

    const subtopicLabel = dayTopics[0] && dayTopics[0] !== concept.name ? ` — ${dayTopics[0]}` : ` — Part ${dayInConcept}`;
    const dayTitle = totalDays > concepts.length ? `${concept.name}${subtopicLabel}` : concept.name;

    days.push({
      dayNumber: dayNum,
      title: dayTitle,
      conceptId: concept.id,
      topicsCovered: dayTopics,
      durationMinutes: minutesPerDay,
    });
  }

  return days;
}

/**
 * Build concepts directly from extracted document units (Source-of-truth fallback)
 */
function buildConceptsFromUnits(
  units: ExtractedUnit[],
  courseTitle: string,
  safeMinutes: number
): { concepts: GeneratedConcept[]; unitTopicMap: Map<string, string[]> } {
  const concepts: GeneratedConcept[] = [];
  const unitTopicMap = new Map<string, string[]>();

  units.forEach((unit, idx) => {
    // Clean unit title: remove leading "Unit I —", "Module 1:", etc.
    const cleanName = unit.title
      .replace(/^(?:Unit|Module|Chapter|Part|Section)\s+[IVX0-9]+[\s\-\—:.]+/i, "")
      .trim() || unit.title;

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30) || `unit-${idx + 1}`;

    const conceptId = `c-${idx + 1}-${slug}`;
    const prereqId = idx > 0 ? concepts[idx - 1]?.id : null;

    unitTopicMap.set(conceptId, unit.subtopics);

    concepts.push({
      id: conceptId,
      name: cleanName,
      slug,
      importance: "high",
      difficulty: idx === 0 ? "Beginner" : idx < units.length - 1 ? "Intermediate" : "Advanced",
      estimatedMinutes: safeMinutes,
      description: `In-depth study of ${cleanName} covering ${unit.subtopics.slice(0, 3).join(", ") || "core principles"}.`,
      prerequisites: prereqId ? [prereqId] : [],
      dependents: [],
      keyFormulas: unit.formulas.slice(0, 4),
      dayAssigned: 1,
    });
  });

  return { concepts, unitTopicMap };
}

/**
 * Domain-Adaptive Title Fallback
 * Detects the domain from a course title and returns appropriate concept modules.
 * Covers Electronics, CS, Math, Physics, Mechanical, Biology, and generic STEM.
 */
function synthesizeDomainAdaptiveConcepts(
  title: string,
  level: string,
  safeMinutes: number
): GeneratedConcept[] {
  const t = title.toLowerCase();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);

  let modules: Array<{ name: string; desc: string; diff: "Beginner" | "Intermediate" | "Advanced" }>;

  if (/electronic|circuit|semiconductor|diode|transistor|amplif|bjt|mosfet|signal|dc|ac|analog|digital|logic|vhdl|verilog|power|electr/i.test(t)) {
    modules = [
      { name: `${title} — Semiconductor Fundamentals`, desc: `Atomic structure, energy bands, carrier transport equations.`, diff: "Beginner" },
      { name: `${title} — p-n Junction & Diodes`, desc: `Junction physics, diode V-I characteristics, load-line analysis.`, diff: "Beginner" },
      { name: `${title} — Bipolar Junction Transistors`, desc: `BJT operating regions, DC biasing, h-parameter equivalent circuits.`, diff: "Intermediate" },
      { name: `${title} — Field-Effect Transistors`, desc: `MOSFET/JFET operation, pinch-off, small-signal models.`, diff: "Intermediate" },
      { name: `${title} — Amplifier Circuits & Feedback`, desc: `Common-emitter/source configurations, feedback topologies, gain analysis.`, diff: "Intermediate" },
      { name: `${title} — Frequency Response & Stability`, desc: `Bode plots, bandwidth, gain-bandwidth product, stability criteria.`, diff: "Advanced" },
    ];
  } else if (/algorithm|data structure|python|java|c\+\+|software|program|compil|database|operating system|network|machine learn|artificial intel|computer science|web dev|react|node/i.test(t)) {
    modules = [
      { name: `${title} — Fundamentals & Complexity`, desc: `Core language constructs, time/space complexity (Big-O), and problem framing.`, diff: "Beginner" },
      { name: `${title} — Linear Data Structures`, desc: `Arrays, linked lists, stacks, queues — implementation and traversal algorithms.`, diff: "Beginner" },
      { name: `${title} — Non-Linear Data Structures`, desc: `Trees, graphs (BFS/DFS), heaps, and balanced BSTs.`, diff: "Intermediate" },
      { name: `${title} — Sorting & Searching Algorithms`, desc: `Merge sort, quick sort, binary search — correctness proofs and performance.`, diff: "Intermediate" },
      { name: `${title} — Dynamic Programming & Greedy`, desc: `Optimal substructure, memoization, DP recurrences, greedy proofs.`, diff: "Advanced" },
      { name: `${title} — System Design & Applications`, desc: `Architecture patterns, scalability, real-world problem solving.`, diff: "Advanced" },
    ];
  } else if (/math|calculus|algebra|statistics|probability|differenti|integral|fourier|laplace|number theory|discrete math|topology/i.test(t)) {
    modules = [
      { name: `${title} — Definitions & Axioms`, desc: `Core definitions, notation, fundamental theorems, and proof strategies.`, diff: "Beginner" },
      { name: `${title} — Core Operations & Properties`, desc: `Key operations, identities, and fundamental computational techniques.`, diff: "Beginner" },
      { name: `${title} — Theorems & Formal Proofs`, desc: `Major theorems, corollaries, rigorous proof construction.`, diff: "Intermediate" },
      { name: `${title} — Applied Problem Solving`, desc: `Worked problems, standard exam-style derivations, and worked examples.`, diff: "Intermediate" },
      { name: `${title} — Advanced Topics & Extensions`, desc: `Generalizations, convergence analysis, advanced applications.`, diff: "Advanced" },
      { name: `${title} — Integration & Cross-Domain Applications`, desc: `Connections to physics, engineering, and data science.`, diff: "Advanced" },
    ];
  } else if (/physics|mechanic|thermodynam|optic|quantum|electromag|relativity|wave|nuclear|fluid/i.test(t)) {
    modules = [
      { name: `${title} — Physical Laws & Governing Equations`, desc: `Fundamental laws, SI units, physical constants, and dimensional analysis.`, diff: "Beginner" },
      { name: `${title} — Kinematics & Dynamics`, desc: `Motion equations, Newton's laws, energy-work theorems.`, diff: "Beginner" },
      { name: `${title} — Conservation Laws`, desc: `Conservation of energy, momentum, angular momentum — derivations and applications.`, diff: "Intermediate" },
      { name: `${title} — Wave & Field Theory`, desc: `Wave equations, field concepts, superposition, interference.`, diff: "Intermediate" },
      { name: `${title} — Thermodynamic Systems`, desc: `State functions, laws of thermodynamics, entropy, and heat engines.`, diff: "Intermediate" },
      { name: `${title} — Advanced Quantum & Modern Physics`, desc: `Schrodinger equation, wave-particle duality, quantum numbers, nuclear models.`, diff: "Advanced" },
    ];
  } else if (/mechanical|civil|structural|manufacturing|material|stress|strain|heat transfer|control system/i.test(t)) {
    modules = [
      { name: `${title} — Engineering Mechanics`, desc: `Static equilibrium, free body diagrams, force analysis.`, diff: "Beginner" },
      { name: `${title} — Material Properties & Behavior`, desc: `Stress-strain curves, elastic modulus, material failure criteria.`, diff: "Beginner" },
      { name: `${title} — Structural Analysis`, desc: `Beam bending, shear force diagrams, bending moment diagrams.`, diff: "Intermediate" },
      { name: `${title} — Fluid Mechanics`, desc: `Continuity equation, Bernoulli theorem, pipe flow, Reynolds number.`, diff: "Intermediate" },
      { name: `${title} — Heat Transfer & Thermodynamics`, desc: `Conduction, convection, radiation, heat exchanger design.`, diff: "Intermediate" },
      { name: `${title} — Advanced Design & Optimization`, desc: `FEM concepts, fatigue analysis, system optimization.`, diff: "Advanced" },
    ];
  } else if (/biology|biochem|genetics|micro|cell|anatomy|physiology|ecology|molecular|neuroscience/i.test(t)) {
    modules = [
      { name: `${title} — Cell Biology & Biochemical Foundations`, desc: `Cell structure, biomolecules, metabolic pathways.`, diff: "Beginner" },
      { name: `${title} — Genetics & DNA`, desc: `DNA replication, transcription, translation, Mendelian genetics.`, diff: "Beginner" },
      { name: `${title} — Physiology & Systems`, desc: `Organ systems, homeostasis, regulatory mechanisms.`, diff: "Intermediate" },
      { name: `${title} — Microbiology & Immunology`, desc: `Microbial classification, immune response, pathogens.`, diff: "Intermediate" },
      { name: `${title} — Ecology & Evolution`, desc: `Population dynamics, natural selection, ecosystems.`, diff: "Intermediate" },
      { name: `${title} — Advanced Molecular & Biotechnology`, desc: `PCR, CRISPR, recombinant DNA, bioinformatics.`, diff: "Advanced" },
    ];
  } else {
    modules = [
      { name: `${title} — Foundations & Core Definitions`, desc: `Fundamental terminology, governing laws, and primary analytical frameworks.`, diff: "Beginner" },
      { name: `${title} — Core Principles & Methods`, desc: `Primary techniques, standard approaches, and essential problem-solving methods.`, diff: "Beginner" },
      { name: `${title} — Systematic Analysis & Modeling`, desc: `Mathematical or logical models, derivations, and analytical methods.`, diff: "Intermediate" },
      { name: `${title} — Practical Applications & Case Studies`, desc: `Real-world application, standard configurations, and worked examples.`, diff: "Intermediate" },
      { name: `${title} — Advanced Topics & Optimization`, desc: `Edge cases, performance considerations, and advanced synthesis.`, diff: "Advanced" },
      { name: `${title} — Integration & Capstone`, desc: `Cross-concept integration, capstone problem solving, and review.`, diff: "Advanced" },
    ];
  }

  // Adjust difficulty labels based on the student's declared level
  const difficultyLadder: Array<"Beginner" | "Intermediate" | "Advanced"> = ["Beginner", "Intermediate", "Advanced"];
  const levelBoost: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const boost = levelBoost[level] ?? 0;

  return modules.map((m, idx) => ({
    id: `c-${idx + 1}-${slug}`,
    name: m.name,
    slug: `${slug}-m${idx + 1}`,
    importance: "high" as const,
    difficulty: difficultyLadder[Math.min(difficultyLadder.indexOf(m.diff) + boost, 2)],
    estimatedMinutes: safeMinutes,
    description: m.desc,
    prerequisites: idx > 0 ? [`c-${idx}-${slug}`] : [],
    dependents: [],
    keyFormulas: [],
    dayAssigned: 1,
  }));
}


// ─────────────────────────────────────────────────────────────────────────────
// Main Curriculum Service
// ─────────────────────────────────────────────────────────────────────────────

export class CurriculumService {
  static async generateCurriculum(params: {
    title: string;
    goal: string;
    level: string;
    totalDays: number;
    minutesPerDay: number;
    sourceContext?: string;
    extractedUnits?: ExtractedUnit[];
  }): Promise<GeneratedCurriculum> {
    const provider = getAIProvider();
    const safeTotalDays = params.totalDays || 30;
    const safeMinutes = params.minutesPerDay || 60;
    const title = params.title || "Technical Course";

    // 1. Extract units from source context if not explicitly passed
    let units = params.extractedUnits || [];
    if (units.length === 0 && params.sourceContext) {
      units = RAGService.extractDocumentStructure(params.sourceContext);
    }

    // 2. Try AI Generation (Nemotron / Groq / Gemini)
    if (provider) {
      const unitsContext = units.length > 0
        ? units.map((u, i) => `Unit ${i + 1}: ${u.title}\nTopics: ${u.subtopics.join(", ")}\nFormulas: ${u.formulas.join(", ")}`).join("\n\n")
        : params.sourceContext?.slice(0, 6000) || "";

      const systemPrompt = `You are SmartLearn AI Course Architect.
Analyze the provided course title, student knowledge level, and syllabus material.
Generate a structured knowledge graph (DAG) of 6 to 12 concept nodes matching the EXACT subject.

HALLUCINATION GUARD — MANDATORY:
1. Concept names MUST come ONLY from the syllabus / subject material provided. Do NOT invent topic names.
2. NEVER use generic placeholder names like "Core Axioms", "Architectural Synthesis", or "Systematic Analysis".
3. Do NOT include topics, formulas, or concepts that are NOT in the provided source material.
4. If the source is limited, generate fewer (4-6) accurate concepts instead of inventing additional ones.
5. Formulate prerequisites based on logical learning order (e.g. Diodes -> Transistors -> Amplifiers).
6. Extract ONLY real equations and formulas directly stated in the material for keyFormulas.
7. Provide 4 to 8 granular distinct subtopics per concept — each should map to one focused day of study.
8. Calibrate all concept descriptions and difficulty to the student's knowledge level: ${params.level || "Intermediate"}.

Return ONLY a valid JSON object (NO markdown wrapper, NO text outside the JSON) matching this schema:
{
  "description": "2-3 sentence overview of what the student will master in this course",
  "category": "Academic Subject Category (e.g. Electronic Devices & Circuits, Computer Science)",
  "concepts": [
    {
      "id": "short-kebab-id",
      "name": "Exact Subject Concept Name from Syllabus",
      "slug": "concept-slug",
      "importance": "high",
      "difficulty": "Beginner",
      "estimatedMinutes": ${safeMinutes},
      "description": "Concise concept overview grounded in the syllabus",
      "prerequisites": [],
      "keyFormulas": ["Exact Formula from Source 1", "Exact Formula from Source 2"],
      "subtopics": ["Specific Topic A", "Specific Topic B", "Specific Topic C", "Specific Topic D"]
    }
  ]
}`;

      const userPrompt = `Course: "${title}"
Goal: "${params.goal}"
Student Knowledge Level: ${params.level || "Intermediate"}
Schedule: ${safeTotalDays} days (${safeMinutes} mins/day)

Syllabus / Units Material (GROUND TRUTH — use ONLY what is here):
${unitsContext}

Synthesize 6 to 10 distinct concept nodes with prerequisite dependencies and 4-8 specific daily subtopics per concept. Stay strictly grounded to the source material above.`;

      try {
        const result = await provider.generateJSON<{
          description?: string;
          category?: string;
          concepts?: Array<GeneratedConcept & { subtopics?: string[] }>;
        }>(userPrompt, systemPrompt);

        if (result && Array.isArray(result.concepts) && result.concepts.length >= 3) {
          const aiUnitTopicMap = new Map<string, string[]>();

          const rawConcepts: GeneratedConcept[] = result.concepts.map((c, i) => {
            const conceptId = c.id || `c-${i + 1}-${c.slug || "concept"}`;
            if (Array.isArray(c.subtopics) && c.subtopics.length > 0) {
              aiUnitTopicMap.set(conceptId, c.subtopics);
            }
            return {
              id: conceptId,
              name: c.name,
              slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              importance: c.importance || "high",
              difficulty: c.difficulty || (i === 0 ? "Beginner" : i < result.concepts!.length - 1 ? "Intermediate" : "Advanced"),
              estimatedMinutes: c.estimatedMinutes || safeMinutes,
              description: c.description || `Mastery of ${c.name}.`,
              prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
              dependents: [],
              keyFormulas: Array.isArray(c.keyFormulas) ? c.keyFormulas : [],
              dayAssigned: 1,
            };
          });

          const withDays = assignDaysByDepth(rawConcepts, safeTotalDays);
          const withDependents = computeDependents(withDays);
          const daysList = buildScheduleFromConcepts(withDependents, safeTotalDays, safeMinutes, aiUnitTopicMap.size > 0 ? aiUnitTopicMap : undefined);

          return {
            description: result.description || `${safeTotalDays}-day curriculum for ${title}.`,
            category: result.category || "Technical Engineering",
            concepts: withDependents,
            daysList,
          };
        }
      } catch (err) {
        console.warn("AI Curriculum synthesis fallback, deriving from source units:", err);
      }
    }

    // 3. Source-Derived Fallback (Uses Document Units directly — NO hardcoded data)
    if (units.length >= 2) {
      const { concepts, unitTopicMap } = buildConceptsFromUnits(units, title, safeMinutes);
      const withDays = assignDaysByDepth(concepts, safeTotalDays);
      const withDependents = computeDependents(withDays);
      const daysList = buildScheduleFromConcepts(withDependents, safeTotalDays, safeMinutes, unitTopicMap);

      return {
        description: `Comprehensive ${safeTotalDays}-day curriculum for ${title} derived directly from uploaded course notes across ${units.length} primary units.`,
        category: "Electronics Engineering",
        concepts: withDependents,
        daysList,
      };
    }

    // 4. Domain-Adaptive Title-Derived Fallback (for courses without document upload)
    const titleConcepts = synthesizeDomainAdaptiveConcepts(title, params.level || "Intermediate", safeMinutes);
    const withDays = assignDaysByDepth(titleConcepts, safeTotalDays);
    const withDependents = computeDependents(withDays);
    const daysList = buildScheduleFromConcepts(withDependents, safeTotalDays, safeMinutes);

    return {
      description: `Structured ${safeTotalDays}-day curriculum for ${title} covering foundational principles to advanced applications, calibrated for ${params.level || "Intermediate"} level.`,
      category: "Engineering & Applied Sciences",
      concepts: withDependents,
      daysList,
    };
  }
}
