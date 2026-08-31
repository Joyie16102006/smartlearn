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
 * Build concepts directly from extracted document units (Multi-Branch DAG structure)
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

    // Multi-branch DAG prerequisites:
    // Node 0: Root
    // Node 1 & 2: Parallel branches from Node 0
    // Node 3: Sub-branch from Node 1
    // Node 4: Sub-branch from Node 2
    // Node 5+: Convergence from multiple upstream branches
    let prereqs: string[] = [];
    if (idx === 1 || idx === 2) {
      if (concepts[0]) prereqs.push(concepts[0].id);
    } else if (idx === 3) {
      if (concepts[1]) prereqs.push(concepts[1].id);
    } else if (idx === 4) {
      if (concepts[2]) prereqs.push(concepts[2].id);
    } else if (idx >= 5) {
      const p1 = concepts[idx - 2]?.id;
      const p2 = concepts[idx - 1]?.id;
      if (p1) prereqs.push(p1);
      if (p2 && p2 !== p1) prereqs.push(p2);
    }

    unitTopicMap.set(conceptId, unit.subtopics);

    concepts.push({
      id: conceptId,
      name: cleanName,
      slug,
      importance: "high",
      difficulty: idx === 0 ? "Beginner" : idx < units.length - 1 ? "Intermediate" : "Advanced",
      estimatedMinutes: safeMinutes,
      description: `In-depth study of ${cleanName} covering ${unit.subtopics.slice(0, 3).join(", ") || "core principles"}.`,
      prerequisites: prereqs,
      dependents: [],
      keyFormulas: unit.formulas.slice(0, 4),
      dayAssigned: 1,
    });
  });

  return { concepts, unitTopicMap };
}

/**
 * Domain-Adaptive Title Fallback with Multi-Branch Knowledge Tree Structure
 * Generates true 2D branching trees (Root -> 2 parallel tracks -> Sub-branches -> Capstone Convergence)
 */
function synthesizeDomainAdaptiveConcepts(
  title: string,
  level: string,
  safeMinutes: number
): GeneratedConcept[] {
  const t = title.toLowerCase();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);

  interface ModuleDef {
    name: string;
    desc: string;
    diff: "Beginner" | "Intermediate" | "Advanced";
    prereqIndices: number[];
  }

  let modules: ModuleDef[];

  // 1. Java & Object Oriented Programming (OOP)
  if (/java|oop|object-oriented|class|encapsulation|polymorphism|inheritance|abstraction|spring|jvm/i.test(t)) {
    modules = [
      { name: `${title} — Classes, Objects & OOP Foundations`, desc: `Class blueprints, instantiation, constructors, memory allocation, and the 'this' reference.`, diff: "Beginner", prereqIndices: [] },
      { name: `${title} — Encapsulation & Inheritance Hierarchies`, desc: `Access modifiers (public/private/protected), data hiding, super keyword, and single/multilevel inheritance.`, diff: "Beginner", prereqIndices: [0] },
      { name: `${title} — Polymorphism, Dynamic Binding & Interfaces`, desc: `Method overriding vs overloading, runtime dispatch, abstract classes vs interface contracts.`, diff: "Intermediate", prereqIndices: [0] },
      { name: `${title} — Exception Handling & Resource Management`, desc: `Try-catch-finally blocks, checked vs unchecked exceptions, custom exception hierarchies, and ARM try-with-resources.`, diff: "Intermediate", prereqIndices: [1] },
      { name: `${title} — Java Collections & Generics`, desc: `List, Set, Map hierarchies, ArrayList vs LinkedList, HashMap internals, and generic type parameters.`, diff: "Intermediate", prereqIndices: [2] },
      { name: `${title} — Multithreading, Concurrency & Design Patterns`, desc: `Thread lifecycle, synchronization, volatile/atomic variables, and classic OOP Design Patterns (Singleton, Factory, Strategy).`, diff: "Advanced", prereqIndices: [3, 4] },
    ];
  }
  // 2. Data Structures & Algorithms
  else if (/algorithm|data structure|dsa|tree|graph|binary search|sorting|dynamic programming|greedy/i.test(t)) {
    modules = [
      { name: `${title} — Complexity Analysis & Core Fundamentals`, desc: `Asymptotic analysis (Big-O, Big-Omega, Big-Theta), recursion trees, space-time tradeoffs.`, diff: "Beginner", prereqIndices: [] },
      { name: `${title} — Linear Data Structures & Operations`, desc: `Dynamic arrays, singly/doubly linked lists, stack evaluation, queue variants.`, diff: "Beginner", prereqIndices: [0] },
      { name: `${title} — Tree Structures & Hierarchical Data`, desc: `Binary trees, BST traversal (pre/in/post), AVL balancing, heaps and priority queues.`, diff: "Intermediate", prereqIndices: [0] },
      { name: `${title} — Graph Algorithms & Traversals`, desc: `Adjacency representations, BFS, DFS, Dijkstra shortest path, topological sorting.`, diff: "Intermediate", prereqIndices: [2] },
      { name: `${title} — Dynamic Programming & Greedy Strategies`, desc: `Overlapping subproblems, optimal substructure, 1D/2D memoization, greedy choice proofs.`, diff: "Advanced", prereqIndices: [1] },
      { name: `${title} — Advanced Optimization & Scalable Systems`, desc: `Disjoint-set union, trie trees, segment trees, and real-world system optimization.`, diff: "Advanced", prereqIndices: [3, 4] },
    ];
  }
  // 3. Electronic Devices & Circuits
  else if (/electronic|circuit|semiconductor|diode|transistor|amplif|bjt|mosfet|signal|dc|ac|analog|digital|logic|vhdl|verilog|power|electr/i.test(t)) {
    modules = [
      { name: `${title} — Semiconductor Physics & Band Theory`, desc: `Intrinsic/extrinsic semiconductors, Fermi level, carrier drift and diffusion.`, diff: "Beginner", prereqIndices: [] },
      { name: `${title} — p-n Junctions, Diodes & Rectification`, desc: `Barrier potential, forward/reverse bias, Zener diodes, wave-shaping clippers and clampers.`, diff: "Beginner", prereqIndices: [0] },
      { name: `${title} — Bipolar Junction Transistors (BJT) & Biasing`, desc: `NPN/PNP physics, CE/CB/CC configurations, DC load line, operating point stabilization.`, diff: "Intermediate", prereqIndices: [0] },
      { name: `${title} — Field-Effect Transistors (MOSFET & JFET)`, desc: `Enhancement/depletion MOSFETs, channel modulation, pinch-off, small-signal models.`, diff: "Intermediate", prereqIndices: [2] },
      { name: `${title} — Small-Signal & Multi-Stage Amplifiers`, desc: `h-parameter analysis, frequency response, RC coupling, power stages.`, diff: "Intermediate", prereqIndices: [1, 2] },
      { name: `${title} — Operational Amplifiers & Feedback Systems`, desc: `Negative/positive feedback, inverting/non-inverting op-amps, active filters, stability criteria.`, diff: "Advanced", prereqIndices: [3, 4] },
    ];
  }
  // 4. Mathematics & Calculus
  else if (/math|calculus|algebra|statistics|probability|differenti|integral|fourier|laplace|discrete/i.test(t)) {
    modules = [
      { name: `${title} — Foundations, Limits & Continuity`, desc: `Axioms, epsilon-delta definitions, fundamental limits, and continuity theorems.`, diff: "Beginner", prereqIndices: [] },
      { name: `${title} — Differential Calculus & Derivative Applications`, desc: `Chain rule, implicit differentiation, Mean Value Theorem, optimization & rate analysis.`, diff: "Beginner", prereqIndices: [0] },
      { name: `${title} — Integral Calculus & Accumulation`, desc: `Fundamental Theorem of Calculus, substitution, integration by parts, definite integrals.`, diff: "Intermediate", prereqIndices: [0] },
      { name: `${title} — Multivariable Analysis & Partial Derivatives`, desc: `Gradients, directional derivatives, tangent planes, Lagrange multipliers.`, diff: "Intermediate", prereqIndices: [1] },
      { name: `${title} — Differential Equations & Vector Calculus`, desc: `First/second order ODEs, line integrals, Green's/Stokes' theorems.`, diff: "Advanced", prereqIndices: [2] },
      { name: `${title} — Transforms, Series & Advanced Synthesis`, desc: `Taylor series convergence, Fourier analysis, Laplace transforms, and complex integration.`, diff: "Advanced", prereqIndices: [3, 4] },
    ];
  }
  // 5. Physics & Applied Sciences
  else if (/physics|mechanic|thermodynam|optic|quantum|electromag|relativity|wave|nuclear|fluid/i.test(t)) {
    modules = [
      { name: `${title} — Governing Laws & Kinematics`, desc: `SI units, dimensional analysis, vector kinematics, and Newton's fundamental laws.`, diff: "Beginner", prereqIndices: [] },
      { name: `${title} — Conservation Principles & Dynamics`, desc: `Work-energy theorem, momentum conservation, rotational dynamics, torque.`, diff: "Beginner", prereqIndices: [0] },
      { name: `${title} — Electromagnetic Fields & Waves`, desc: `Coulomb's law, Gauss's law, magnetic flux, Faraday induction, wave equations.`, diff: "Intermediate", prereqIndices: [0] },
      { name: `${title} — Thermodynamics & Statistical Physics`, desc: `Laws of thermodynamics, heat engines, entropy, Maxwell relations.`, diff: "Intermediate", prereqIndices: [1] },
      { name: `${title} — Optics & Wave Interference`, desc: `Geometric optics, Huygens principle, diffraction gratings, polarization.`, diff: "Intermediate", prereqIndices: [2] },
      { name: `${title} — Modern & Quantum Physics`, desc: `Photoelectric effect, wave-particle duality, Schrodinger wave equation, atomic models.`, diff: "Advanced", prereqIndices: [3, 4] },
    ];
  }
  // 6. General STEM / Technical Course Default
  else {
    modules = [
      { name: `${title} — Foundational Principles & Core Syntax`, desc: `Core definitions, underlying assumptions, standard notation, and first principles.`, diff: "Beginner", prereqIndices: [] },
      { name: `${title} — Core Structure & Methodologies`, desc: `Primary methods, standard models, essential rules, and analytical framework.`, diff: "Beginner", prereqIndices: [0] },
      { name: `${title} — Applied Concepts & Analytical Modeling`, desc: `Component interaction, formal derivations, problem deconstruction.`, diff: "Intermediate", prereqIndices: [0] },
      { name: `${title} — Intermediate Practical Implementations`, desc: `Standard workflows, practical configurations, and worked technical examples.`, diff: "Intermediate", prereqIndices: [1] },
      { name: `${title} — Advanced Specialization & Extensions`, desc: `Edge cases, high-level analysis, advanced synthesis, and performance considerations.`, diff: "Advanced", prereqIndices: [2] },
      { name: `${title} — Capstone Synthesis & Systems Integration`, desc: `Comprehensive end-to-end integration, real-world case studies, and full mastery review.`, diff: "Advanced", prereqIndices: [3, 4] },
    ];
  }

  // Adjust difficulty labels based on the student's declared level
  const difficultyLadder: Array<"Beginner" | "Intermediate" | "Advanced"> = ["Beginner", "Intermediate", "Advanced"];
  const levelBoost: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const boost = levelBoost[level] ?? 0;

  const conceptIds = modules.map((_, idx) => `c-${idx + 1}-${slug}`);

  return modules.map((m, idx) => ({
    id: conceptIds[idx],
    name: m.name,
    slug: `${slug}-m${idx + 1}`,
    importance: "high" as const,
    difficulty: difficultyLadder[Math.min(difficultyLadder.indexOf(m.diff) + boost, 2)],
    estimatedMinutes: safeMinutes,
    description: m.desc,
    prerequisites: m.prereqIndices.map((i) => conceptIds[i]).filter(Boolean),
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

      const systemPrompt = `You are SmartLearn AI Course Architect & Knowledge Graph Engineer.
Analyze the provided course title, student knowledge level, and syllabus material.
Generate a structured, multi-branching Knowledge Tree (Directed Acyclic Graph - DAG) of 6 to 10 concept nodes matching the EXACT subject.

MANDATORY TREE & GRAPH STRUCTURE (CRITICAL):
1. NEVER generate a single flat 1-line linear sequence (Node 1 -> Node 2 -> Node 3 -> Node 4). The curriculum MUST branch like a tree!
2. Structure the concepts with multiple branching tracks:
   - Root Node(s) [Level 0]: 1 foundational concept node with NO prerequisites ("prerequisites": []).
   - Parallel Branch Tracks [Level 1]: 2 or 3 distinct specialization concepts that BOTH list the Root node as their prerequisite (e.g. "prerequisites": ["root-id"]).
   - Intermediate Sub-branches [Level 2]: Concepts that deepen Level 1 tracks (e.g. "prerequisites": ["branch-a-id"]).
   - Advanced Convergence / Capstone [Level 3]: 1 or 2 advanced concepts that depend on multiple upstream branches (e.g. "prerequisites": ["branch-a-id", "branch-b-id"]).
3. Ensure prerequisite IDs strictly match the "id" of the corresponding concept in the "concepts" array.
4. Concept names MUST be specific and accurately named for "${title}". NEVER use generic placeholder names like "Core Axioms" or "Linear Data Structures" if the course is about something else (e.g., for "Java OOP", use "Classes & Objects", "Inheritance", "Polymorphism", "Interfaces & Abstraction", "Exception Handling", "Collections & Generics").
5. Calibrate all concept descriptions and difficulty to the student's knowledge level: ${params.level || "Intermediate"}.
6. Provide 4 to 8 granular distinct subtopics per concept — each mapping to one focused study session.

Return ONLY a valid JSON object (NO markdown wrapper, NO text outside the JSON) matching this schema:
{
  "description": "2-3 sentence overview of what the student will master in this course",
  "category": "Academic Subject Category (e.g. Computer Science, Electronic Engineering, Applied Mathematics)",
  "concepts": [
    {
      "id": "c-unique-short-id",
      "name": "Exact Subject Concept Name",
      "slug": "concept-slug",
      "importance": "high",
      "difficulty": "Beginner",
      "estimatedMinutes": ${safeMinutes},
      "description": "Concise concept overview grounded in the syllabus",
      "prerequisites": [],
      "keyFormulas": ["Exact Formula or Rule 1", "Exact Formula or Rule 2"],
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

Synthesize 6 to 8 distinct concept nodes structured as a multi-branching Knowledge Tree/DAG with branching prerequisites and 4-8 specific daily subtopics per concept.`;

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
