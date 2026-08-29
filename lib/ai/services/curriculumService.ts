import { getAIProvider } from "../provider";

/**
 * Model 2: Curriculum & DAG Knowledge Graph Generator
 *
 * Responsibilities:
 * - Deconstruct subject matter into modular Concept Nodes
 * - Build Directed Acyclic Graph (DAG) with prerequisites AND dependents
 * - Calibrate difficulty & estimated mastery duration
 * - Partition curriculum into day-wise study schedule
 * - Use realistic domain-specific fallback content (never hallucinated placeholders)
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
// Domain-Aware Realistic Fallback Concept Trees
// Concepts form a real DAG — prerequisites reference earlier node IDs
// ─────────────────────────────────────────────────────────────────────────────

interface DomainConceptSeed {
  id: string;
  name: string;
  slug: string;
  importance: "high" | "medium" | "low";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  description: string;
  prerequisites: string[];
  keyFormulas?: string[];
}

interface DomainTemplate {
  keywords: RegExp;
  category: string;
  description: (title: string, days: number) => string;
  concepts: DomainConceptSeed[];
}

const DOMAIN_TEMPLATES: DomainTemplate[] = [
  // ── Digital Electronics / EDC ────────────────────────────────────────────
  {
    keywords: /\b(edc|digital electronics|digital circuits|logic design|vlsi|electronics)\b/i,
    category: "Electronics Engineering",
    description: (title, days) =>
      `A ${days}-day mastery path through ${title}: from number systems and Boolean algebra, through logic gates and K-Map minimization, to combinational circuits, sequential logic, flip-flops, registers, and counters.`,
    concepts: [
      {
        id: "num-systems",
        name: "Number Systems",
        slug: "number-systems",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 45,
        description: "Binary, octal, hexadecimal representations and inter-base conversions (binary↔decimal, hex↔binary).",
        prerequisites: [],
        keyFormulas: ["(N)₁₀ → Binary: repeated division by 2", "Binary → Decimal: Σ dᵢ × 2ⁱ", "BCD: each decimal digit → 4 bits"],
      },
      {
        id: "boolean-algebra",
        name: "Boolean Algebra",
        slug: "boolean-algebra",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 50,
        description: "Boolean operations (AND, OR, NOT), postulates, identities, De Morgan's theorems, and algebraic simplification of logic expressions.",
        prerequisites: ["num-systems"],
        keyFormulas: [
          "A + A' = 1",
          "A · A' = 0",
          "A + 0 = A, A · 1 = A",
          "De Morgan: (A·B)' = A' + B'",
          "De Morgan: (A+B)' = A'·B'",
        ],
      },
      {
        id: "logic-gates",
        name: "Logic Gates",
        slug: "logic-gates",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 45,
        description: "AND, OR, NOT, NAND, NOR, XOR, XNOR gates — truth tables, symbols, fan-in/fan-out, and propagation delay.",
        prerequisites: ["boolean-algebra"],
        keyFormulas: [
          "XOR: Y = A⊕B = A'B + AB'",
          "XNOR: Y = A⊙B = AB + A'B'",
        ],
      },
      {
        id: "universal-gates",
        name: "Universal Gates (NAND & NOR)",
        slug: "universal-gates",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 40,
        description: "NAND and NOR as functionally complete gate sets — implementing NOT, AND, OR, and XOR using only NAND (or only NOR).",
        prerequisites: ["logic-gates"],
        keyFormulas: [
          "NOT from NAND: Y = (A·A)' = A'",
          "AND from NAND: Y = ((AB)')'  = AB",
          "OR from NAND: Y = (A'·B')'  = A+B",
        ],
      },
      {
        id: "boolean-minimization",
        name: "Boolean Simplification",
        slug: "boolean-simplification",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 55,
        description: "Algebraic simplification using Boolean identities. Sum-of-Products (SOP) and Product-of-Sums (POS) canonical forms. Minterms and maxterms.",
        prerequisites: ["boolean-algebra", "logic-gates"],
        keyFormulas: [
          "SOP: f = Σm(min term indices)",
          "POS: f = ΠM(max term indices)",
          "Duality: replace AND↔OR, 0↔1",
        ],
      },
      {
        id: "k-maps",
        name: "Karnaugh Maps (K-Maps)",
        slug: "k-maps",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "2, 3, and 4-variable K-Map grouping for minimal SOP and POS expressions. Don't-care conditions and their exploitation.",
        prerequisites: ["boolean-minimization"],
        keyFormulas: [
          "Group of 2ⁿ cells → eliminates n variables",
          "Essential prime implicant: covers at least one minterm not covered by others",
        ],
      },
      {
        id: "combinational-circuits",
        name: "Combinational Circuits",
        slug: "combinational-circuits",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "Half adder, full adder, ripple carry adder, subtractor, magnitude comparator, and parity generator/checker.",
        prerequisites: ["k-maps", "universal-gates"],
        keyFormulas: [
          "Full Adder Sum: S = A⊕B⊕Cᵢₙ",
          "Full Adder Carry: Cₒᵤₜ = AB + BCᵢₙ + ACᵢₙ",
        ],
      },
      {
        id: "mux-demux",
        name: "Multiplexer & Demultiplexer",
        slug: "mux-demux",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 55,
        description: "2:1, 4:1, 8:1 MUX — data selection, enabling, and use as a universal logic element. 1:2 and 1:4 DEMUX design.",
        prerequisites: ["combinational-circuits"],
        keyFormulas: [
          "2:1 MUX: Y = S'·I₀ + S·I₁",
          "Any n-variable function realizable with 2ⁿ-to-1 MUX",
        ],
      },
      {
        id: "encoder-decoder",
        name: "Encoder & Decoder",
        slug: "encoder-decoder",
        importance: "medium",
        difficulty: "Intermediate",
        estimatedMinutes: 50,
        description: "Priority encoder, BCD encoder, binary encoder. 2:4 and 3:8 decoders, enabling inputs, and cascading.",
        prerequisites: ["combinational-circuits"],
        keyFormulas: [
          "2:4 Decoder: each output = one minterm of 2 select lines",
          "Priority Encoder: highest-priority active input determines output code",
        ],
      },
      {
        id: "sequential-circuits",
        name: "Sequential Circuits & Latches",
        slug: "sequential-circuits",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 55,
        description: "Difference between combinational and sequential logic. SR latch, gated D latch, state tables, state diagrams, and Mealy vs Moore machines.",
        prerequisites: ["combinational-circuits"],
        keyFormulas: [
          "SR Latch: Q_next = S + R'·Q  (constraint: S·R = 0)",
          "Gated D Latch: Q_next = En·D + En'·Q",
        ],
      },
      {
        id: "flip-flops",
        name: "Flip-Flops",
        slug: "flip-flops",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "SR, D, JK, and T flip-flops — characteristic equations, excitation tables, master-slave configuration, and edge-triggering.",
        prerequisites: ["sequential-circuits"],
        keyFormulas: [
          "D FF:  Q_next = D",
          "JK FF: Q_next = J·Q' + K'·Q",
          "T FF:  Q_next = T⊕Q",
        ],
      },
      {
        id: "registers",
        name: "Shift Registers",
        slug: "registers",
        importance: "high",
        difficulty: "Advanced",
        estimatedMinutes: 55,
        description: "SIPO, SISO, PISO, PIPO shift registers. Universal shift register. Applications in serial-to-parallel conversion and data storage.",
        prerequisites: ["flip-flops"],
        keyFormulas: [
          "n-bit shift register stores n bits",
          "Shift-left: Qᵢ ← Qᵢ₋₁ on each clock edge",
        ],
      },
      {
        id: "counters",
        name: "Counters",
        slug: "counters",
        importance: "high",
        difficulty: "Advanced",
        estimatedMinutes: 60,
        description: "Ripple (asynchronous) counters, synchronous counters, MOD-N counters, up/down counters, BCD counter, and ring/Johnson counters.",
        prerequisites: ["registers"],
        keyFormulas: [
          "MOD-N counter: counts 0 to N-1, resets at N",
          "Ripple counter propagation delay = tₚ × number_of_bits",
          "Johnson counter: 2n states for n flip-flops",
        ],
      },
    ],
  },

  // ── Computer Networks ────────────────────────────────────────────────────
  {
    keywords: /\b(computer networks?|networking|cn|tcp\/ip|osi model|data communications?)\b/i,
    category: "Computer Science",
    description: (title, days) =>
      `A ${days}-day structured path through ${title}: from OSI and TCP/IP models, through data link and network layer protocols, to transport layer services and application layer protocols.`,
    concepts: [
      {
        id: "intro-networks",
        name: "Introduction to Networks",
        slug: "intro-networks",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 40,
        description: "Network types (LAN, WAN, MAN), topologies (bus, star, ring, mesh), and client-server vs peer-to-peer models.",
        prerequisites: [],
      },
      {
        id: "osi-model",
        name: "OSI Reference Model",
        slug: "osi-model",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 50,
        description: "Seven-layer OSI model — responsibilities of each layer: physical, data link, network, transport, session, presentation, application.",
        prerequisites: ["intro-networks"],
        keyFormulas: ["Encapsulation: Data → Segment → Packet → Frame → Bits"],
      },
      {
        id: "tcp-ip-model",
        name: "TCP/IP Model",
        slug: "tcp-ip-model",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 45,
        description: "Four-layer TCP/IP model vs OSI. Internet protocol suite and layer mapping.",
        prerequisites: ["osi-model"],
      },
      {
        id: "data-link-layer",
        name: "Data Link Layer",
        slug: "data-link-layer",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 55,
        description: "Framing, error detection (CRC, parity, checksum), MAC addresses, Ethernet frame format, and ARP.",
        prerequisites: ["osi-model"],
        keyFormulas: ["CRC: remainder of Data ÷ Generator polynomial"],
      },
      {
        id: "network-layer",
        name: "Network Layer & IP Addressing",
        slug: "network-layer",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "IPv4/IPv6 addressing, subnetting, CIDR, routing tables, ICMP, and NAT.",
        prerequisites: ["data-link-layer"],
        keyFormulas: ["CIDR: a.b.c.d/prefix → 2^(32-prefix) host addresses", "Subnet mask: /24 → 255.255.255.0"],
      },
      {
        id: "routing",
        name: "Routing Algorithms",
        slug: "routing",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 55,
        description: "Distance-vector (RIP/Bellman-Ford), link-state (OSPF/Dijkstra), path-vector (BGP).",
        prerequisites: ["network-layer"],
        keyFormulas: ["Bellman-Ford: d(x,y) = min{c(x,v) + d(v,y)}"],
      },
      {
        id: "transport-layer",
        name: "Transport Layer (TCP & UDP)",
        slug: "transport-layer",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "TCP 3-way handshake, reliable delivery, flow control (sliding window), congestion control, and UDP.",
        prerequisites: ["network-layer"],
        keyFormulas: ["TCP throughput ≈ MSS / (RTT × √p)", "Window size: min(cwnd, rwnd)"],
      },
      {
        id: "application-layer",
        name: "Application Layer Protocols",
        slug: "application-layer",
        importance: "medium",
        difficulty: "Advanced",
        estimatedMinutes: 50,
        description: "HTTP/HTTPS, DNS resolution, SMTP, FTP, DHCP — how application protocols use transport services.",
        prerequisites: ["transport-layer"],
      },
    ],
  },

  // ── Data Structures & Algorithms ─────────────────────────────────────────
  {
    keywords: /\b(dsa|data structures?|algorithms?|ds&a|cs fundamentals|algorithm design)\b/i,
    category: "Computer Science",
    description: (title, days) =>
      `A ${days}-day DSA mastery plan: arrays, linked lists, stacks, queues, trees, graphs, sorting algorithms, and dynamic programming — building systematically from fundamentals to advanced techniques.`,
    concepts: [
      {
        id: "arrays-strings",
        name: "Arrays & Strings",
        slug: "arrays-strings",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 45,
        description: "Static/dynamic arrays, two-pointer technique, sliding window, and prefix sums.",
        prerequisites: [],
        keyFormulas: ["Access: O(1)", "Search: O(n)", "Insert/Delete: O(n)"],
      },
      {
        id: "linked-lists",
        name: "Linked Lists",
        slug: "linked-lists",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 50,
        description: "Singly and doubly linked lists, cycle detection (Floyd's), reversal, and merge operations.",
        prerequisites: ["arrays-strings"],
        keyFormulas: ["Cycle detection: slow/fast pointer (tortoise & hare)"],
      },
      {
        id: "stacks-queues",
        name: "Stacks & Queues",
        slug: "stacks-queues",
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: 45,
        description: "Stack and queue ADTs, monotonic stack pattern, deque, and expression evaluation.",
        prerequisites: ["linked-lists"],
      },
      {
        id: "trees",
        name: "Trees & Binary Search Tree",
        slug: "trees-bst",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "Binary trees, BST insert/delete/search, AVL rotations, tree traversals (inorder, preorder, postorder, BFS).",
        prerequisites: ["stacks-queues"],
        keyFormulas: ["BST search: O(log n) avg, O(n) worst"],
      },
      {
        id: "heaps",
        name: "Heaps & Priority Queues",
        slug: "heaps",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 50,
        description: "Min-heap and max-heap, heapify operation, heap sort, and priority queue applications.",
        prerequisites: ["trees"],
        keyFormulas: ["Heapify: O(n)", "Insert/Extract-min: O(log n)"],
      },
      {
        id: "graphs",
        name: "Graphs & Traversals",
        slug: "graphs",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 60,
        description: "Adjacency list and matrix, BFS, DFS, topological sort, and cycle detection (directed and undirected).",
        prerequisites: ["stacks-queues", "trees"],
        keyFormulas: ["BFS/DFS: O(V+E)"],
      },
      {
        id: "sorting",
        name: "Sorting Algorithms",
        slug: "sorting",
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: 55,
        description: "Merge sort, quicksort, heap sort, counting sort, radix sort — time/space complexities and stability.",
        prerequisites: ["heaps"],
        keyFormulas: ["Merge Sort: O(n log n)", "Quick Sort avg: O(n log n), worst: O(n²)"],
      },
      {
        id: "dynamic-programming",
        name: "Dynamic Programming",
        slug: "dynamic-programming",
        importance: "high",
        difficulty: "Advanced",
        estimatedMinutes: 70,
        description: "Memoization vs tabulation, overlapping subproblems, optimal substructure. Classic problems: 0/1 knapsack, LCS, LIS, coin change.",
        prerequisites: ["graphs", "sorting"],
        keyFormulas: ["Knapsack: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wᵢ] + vᵢ)"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Graph helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Compute dependents[] from prerequisites — call after concepts are finalized */
function computeDependents(concepts: GeneratedConcept[]): GeneratedConcept[] {
  const idToNode = new Map(concepts.map((c) => [c.id, c]));
  concepts.forEach((c) => { c.dependents = []; });
  concepts.forEach((c) => {
    c.prerequisites.forEach((prereqId) => {
      const prereq = idToNode.get(prereqId);
      if (prereq && !prereq.dependents.includes(c.id)) {
        prereq.dependents.push(c.id);
      }
    });
  });
  return concepts;
}

/** Assign dayAssigned by topological depth within the totalDays budget */
function assignDaysByDepth(concepts: GeneratedConcept[], totalDays: number): GeneratedConcept[] {
  const idToDepth = new Map<string, number>();
  const idMap = new Map(concepts.map((c) => [c.id, c]));

  function depth(id: string, visiting = new Set<string>()): number {
    if (idToDepth.has(id)) return idToDepth.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const node = idMap.get(id);
    const d = node && node.prerequisites.length > 0
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

/** Build day plans distributing totalDays across the concept sequence */
function buildDayPlans(concepts: GeneratedConcept[], totalDays: number, minutesPerDay: number): GeneratedDayPlan[] {
  const days: GeneratedDayPlan[] = [];
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const idx = Math.min(
      Math.floor(((dayNum - 1) / totalDays) * concepts.length),
      concepts.length - 1
    );
    const c = concepts[idx];
    const unitNum = ((dayNum - 1) % Math.max(1, Math.round(totalDays / concepts.length))) + 1;
    days.push({
      dayNumber: dayNum,
      title: totalDays > concepts.length ? `${c.name} — Part ${unitNum}` : c.name,
      conceptId: c.id,
      topicsCovered: c.keyFormulas && c.keyFormulas.length > 0
        ? [c.name, ...c.keyFormulas.slice(0, 2)]
        : [c.name, `${c.name} — Analysis & Practice`],
      durationMinutes: minutesPerDay,
    });
  }
  return days;
}

function detectDomain(title: string, goal: string): DomainTemplate | null {
  const text = `${title} ${goal}`;
  return DOMAIN_TEMPLATES.find((t) => t.keywords.test(text)) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────────────────────

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

    // ── AI Path (Nemotron 550B) ─────────────────────────────────────────────
    if (provider) {
      const systemPrompt = `You are SmartLearn AI Course Architect.
Generate a precise, domain-accurate knowledge graph for a technical course.

CRITICAL RULES — violating these produces wrong output:
1. Concept names MUST be real technical topics from a textbook or syllabus for this exact subject.
2. NEVER use placeholder names like "Core Axioms", "Architectural Synthesis", "Advanced Implementation", "Fundamental Principles", "Systematic Analysis", or any generic labels.
3. For Digital Electronics: use names like "Number Systems", "Boolean Algebra", "Logic Gates", "K-Maps", "Flip-Flops", "Counters".
4. keyFormulas must contain REAL domain-specific equations. No E=mc², no f(x)=y.
5. prerequisites must be IDs of other concepts in your output that logically precede this one.
6. dependents should be left as [] — the server will compute them.

Return ONLY valid JSON (no markdown, no code fences):
{
  "description": "2-3 sentence subject overview",
  "category": "Specific Academic Category",
  "concepts": [
    {
      "id": "short-kebab-id",
      "name": "Exact Technical Topic",
      "slug": "exact-technical-topic",
      "importance": "high",
      "difficulty": "Beginner",
      "estimatedMinutes": ${safeMinutes},
      "description": "What the student learns",
      "prerequisites": [],
      "dependents": [],
      "keyFormulas": ["Real domain formula"],
      "dayAssigned": 1
    }
  ],
  "daysList": [
    {
      "dayNumber": 1,
      "title": "Topic Name",
      "conceptId": "matching-concept-id",
      "topicsCovered": ["Specific subtopic A", "Specific subtopic B"],
      "durationMinutes": ${safeMinutes}
    }
  ]
}`;

      const sourceSection = params.sourceContext
        ? `\n\nUploaded Source Material (extract real concept names and topics from this):\n${params.sourceContext.slice(0, 5000)}`
        : "";

      const userPrompt = `Generate an accurate, domain-specific curriculum for:
Course: "${params.title}"
Goal: "${params.goal}"
Level: ${params.level}
Schedule: ${safeTotalDays} days × ${safeMinutes} min/day
${sourceSection}

Generate 8–14 concept nodes forming a real prerequisite DAG.
Concept names must match real topics in "${params.title}" as they appear in a textbook Table of Contents.
Fill ALL ${safeTotalDays} days in daysList (required).`;

      try {
        const result = await provider.generateJSON<GeneratedCurriculum>(userPrompt, systemPrompt);
        if (result?.concepts?.length > 0) {
          const concepts = result.concepts.map((c, i) => ({
            ...c,
            id: c.id || `concept-${i + 1}`,
            slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            importance: c.importance || "high",
            difficulty: c.difficulty || (i === 0 ? "Beginner" : i < result.concepts.length / 2 ? "Intermediate" : "Advanced"),
            estimatedMinutes: c.estimatedMinutes || safeMinutes,
            prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
            dependents: [],
            keyFormulas: Array.isArray(c.keyFormulas) ? c.keyFormulas : [],
            dayAssigned: c.dayAssigned || Math.min(i * 3 + 1, safeTotalDays),
          })) as GeneratedConcept[];

          // Always recompute dependents server-side
          const withDependents = computeDependents(concepts);

          const daysMap = new Map<number, GeneratedDayPlan>();
          (Array.isArray(result.daysList) ? result.daysList : []).forEach((d) => {
            if (d.dayNumber && d.dayNumber <= safeTotalDays) {
              daysMap.set(d.dayNumber, {
                dayNumber: d.dayNumber,
                title: d.title || `Day ${d.dayNumber}: ${params.title}`,
                conceptId: d.conceptId || withDependents[0].id,
                topicsCovered: Array.isArray(d.topicsCovered) && d.topicsCovered.length > 0
                  ? d.topicsCovered
                  : [withDependents[0].name],
                durationMinutes: d.durationMinutes || safeMinutes,
              });
            }
          });

          for (let dayNum = 1; dayNum <= safeTotalDays; dayNum++) {
            if (!daysMap.has(dayNum)) {
              const idx = Math.min(
                Math.floor(((dayNum - 1) / safeTotalDays) * withDependents.length),
                withDependents.length - 1
              );
              const ac = withDependents[idx];
              daysMap.set(dayNum, {
                dayNumber: dayNum,
                title: `${ac.name} — Part ${((dayNum - 1) % 3) + 1}`,
                conceptId: ac.id,
                topicsCovered: [ac.name, "Analysis & Practice Problems"],
                durationMinutes: safeMinutes,
              });
            }
          }

          return {
            description: result.description || `${safeTotalDays}-day curriculum for ${params.title}.`,
            category: result.category || "Technical Engineering",
            concepts: withDependents,
            daysList: Array.from({ length: safeTotalDays }, (_, i) => daysMap.get(i + 1)!),
          };
        }
      } catch (err) {
        console.warn("Nemotron curriculum generator fallback:", err);
      }
    }

    // ── Domain-Aware Fallback ────────────────────────────────────────────────
    const domain = detectDomain(params.title, params.goal);

    if (domain) {
      const concepts: GeneratedConcept[] = domain.concepts.map((c) => ({
        ...c,
        dependents: [],
        dayAssigned: 1,
        estimatedMinutes: c.estimatedMinutes || safeMinutes,
      }));

      const withDays = assignDaysByDepth(concepts, safeTotalDays);
      const withDependents = computeDependents(withDays);
      const daysList = buildDayPlans(withDependents, safeTotalDays, safeMinutes);

      return {
        description: domain.description(params.title, safeTotalDays),
        category: domain.category,
        concepts: withDependents,
        daysList,
      };
    }

    // ── Generic Title-Derived Fallback ────────────────────────────────────────
    // Derive readable concept names from the actual title — never "Core Axioms"
    const titleLabel = params.title.trim() || "Subject";
    const baseSlug = titleLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const genericConcepts: GeneratedConcept[] = [
      {
        id: `${baseSlug}-intro`,
        name: `Introduction to ${titleLabel}`,
        slug: `${baseSlug}-intro`,
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: safeMinutes,
        description: `Scope, applications, history, and the fundamental building blocks of ${titleLabel}.`,
        prerequisites: [],
        dependents: [],
        keyFormulas: [],
        dayAssigned: 1,
      },
      {
        id: `${baseSlug}-core`,
        name: `${titleLabel} — Core Concepts`,
        slug: `${baseSlug}-core`,
        importance: "high",
        difficulty: "Beginner",
        estimatedMinutes: safeMinutes,
        description: `Key definitions, terminology, and the primary operations studied in ${titleLabel}.`,
        prerequisites: [`${baseSlug}-intro`],
        dependents: [],
        keyFormulas: [],
        dayAssigned: Math.ceil(safeTotalDays * 0.15),
      },
      {
        id: `${baseSlug}-analysis`,
        name: `${titleLabel} — Analysis & Methods`,
        slug: `${baseSlug}-analysis`,
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: safeMinutes,
        description: `Quantitative analysis techniques and problem-solving frameworks in ${titleLabel}.`,
        prerequisites: [`${baseSlug}-core`],
        dependents: [],
        keyFormulas: [],
        dayAssigned: Math.ceil(safeTotalDays * 0.35),
      },
      {
        id: `${baseSlug}-design`,
        name: `${titleLabel} — Design Patterns`,
        slug: `${baseSlug}-design`,
        importance: "high",
        difficulty: "Intermediate",
        estimatedMinutes: safeMinutes,
        description: `Standard design patterns, structural approaches, and best practices in ${titleLabel}.`,
        prerequisites: [`${baseSlug}-analysis`],
        dependents: [],
        keyFormulas: [],
        dayAssigned: Math.ceil(safeTotalDays * 0.55),
      },
      {
        id: `${baseSlug}-advanced`,
        name: `Advanced ${titleLabel}`,
        slug: `${baseSlug}-advanced`,
        importance: "high",
        difficulty: "Advanced",
        estimatedMinutes: safeMinutes,
        description: `Complex applications, edge cases, and optimization strategies in ${titleLabel}.`,
        prerequisites: [`${baseSlug}-design`],
        dependents: [],
        keyFormulas: [],
        dayAssigned: Math.ceil(safeTotalDays * 0.8),
      },
    ];

    const withDependents = computeDependents(genericConcepts);
    const daysList = buildDayPlans(withDependents, safeTotalDays, safeMinutes);

    return {
      description: `Structured ${safeTotalDays}-day curriculum for ${titleLabel}. Designed for ${params.level} level at ${safeMinutes} minutes per day.`,
      category: "Technical Studies",
      concepts: withDependents,
      daysList,
    };
  }
}

function conceptsLength(arr: unknown[]): number {
  return Array.isArray(arr) ? arr.length : 3;
}
