import { ExplanationData } from "@/types/explanation";

export const mockExplanations: Record<string, ExplanationData> = {
  "ohms-law": {
    id: "ohms-law",
    title: "Understanding Ohm's Law",
    category: "Electrical Foundations",
    targetSnippet: "V = I · R",
    terms: [
      { term: "V", definition: "Voltage (Electric potential difference in Volts)" },
      { term: "I", definition: "Current (Flow of electric charge in Amperes)" },
      { term: "R", definition: "Resistance (Opposition to current flow in Ohms, Ω)" },
    ],
    simpleExplanation:
      "Ohm's Law describes the linear relationship between voltage, current, and resistance in an electrical circuit. It states that the current flowing through a conductor between two points is directly proportional to the voltage across the two points, and inversely proportional to the resistance.",
    example:
      "If a circuit has a 12V battery and a resistor of 4Ω, the current flowing through the circuit is: I = V / R = 12 / 4 = 3 Amperes (A).",
    formulaOrDiagram: `    +---[ Resistor: R = 4Ω ]---+
    |                          |
   ( + )                      ---
  [ 12V Battery ]            | I = 3A |
   ( - )                      -->
    |                          |
    +--------------------------+`,
    diagramTitle: "DC Circuit Loop Representation",
    deeperExplanation: {
      breakdown:
        "Think of voltage as the electrical 'pressure' pushing charge carriers (electrons), current as the rate of flow of water through a pipe, and resistance as a constriction or valve narrowing the pipe.",
      analogy:
        "Imagine a water pipe: High voltage = higher water pressure pump. High resistance = thinner pipe. Higher pressure pushes more water, while a thinner pipe restricts water flow.",
      commonPitfalls: [
        "Confusing millivolts (mV) or milliamps (mA) with base units when calculating values.",
        "Assuming Ohm's law applies to non-ohmic components like diodes or transistors where resistance varies with voltage.",
      ],
      keyTakeaways: [
        "V = I · R (Solve for voltage)",
        "I = V / R (Solve for current)",
        "R = V / I (Solve for resistance)",
      ],
    },
  },

  "mux-4to1-equation": {
    id: "mux-4to1-equation",
    title: "4:1 Multiplexer Boolean Equation",
    category: "Combinational Logic",
    targetSnippet: "Y = S₁'·S₀'·I₀ + S₁'·S₀·I₁ + S₁·S₀'·I₂ + S₁·S₀·I₃",
    terms: [
      { term: "Y", definition: "Single output line of the multiplexer" },
      { term: "S₁, S₀", definition: "Binary select lines (S₁ is MSB, S₀ is LSB)" },
      { term: "I₀, I₁, I₂, I₃", definition: "Four parallel data input lines" },
      { term: "S₁', S₀'", definition: "Inverted (NOT) select line values" },
    ],
    simpleExplanation:
      "A 4:1 multiplexer acts like a digital rotary switch. Depending on the 2-bit binary code applied to select lines (S₁S₀), exactly ONE of the four data inputs (I₀, I₁, I₂, or I₃) is routed to the output Y, while the other three inputs are blocked.",
    example:
      "When S₁ = 1 and S₀ = 0 (binary 2), the term S₁·S₀' evaluates to 1. Thus, Y = (0)·I₀ + (0)·I₁ + (1)·I₂ + (0)·I₃ = I₂. The value present on data line I₂ appears at output Y.",
    formulaOrDiagram: `Select (S₁S₀) | Enabled Term | Output Y
---------------------------------------
    00        |  S₁'·S₀'     |   I₀
    01        |  S₁'·S₀      |   I₁
    10        |  S₁·S₀'      |   I₂
    11        |  S₁·S₀       |   I₃`,
    diagramTitle: "4:1 MUX Select Line Truth Table",
    deeperExplanation: {
      breakdown:
        "The internal hardware is constructed from a 2-to-4 decoder (generating the 4 minterms S₁'S₀', S₁'S₀, S₁S₀', S₁S₀) connected to four 2-input AND gates. The outputs of all AND gates are combined using a 4-input OR gate.",
      analogy:
        "Think of a railway track switcher: A single train track (output Y) connects to 4 incoming tracks (I₀–I₃). The switch controller lever (select lines S₁S₀) aligns the single track to one specific incoming line.",
      commonPitfalls: [
        "Swapping S₁ and S₀ (MSB vs LSB), which transposes inputs I₁ and I₂.",
        "Forgetting that if Enable (E) is low/inactive, Y will remain 0 regardless of S₁S₀.",
      ],
      keyTakeaways: [
        "A multiplexer is also known as a Data Selector or Many-to-One converter.",
        "Number of select lines m for N data inputs is given by 2ᵐ = N.",
      ],
    },
  },

  "select-lines-formula": {
    id: "select-lines-formula",
    title: "Multiplexer Select Line Rule",
    category: "Architecture Sizing",
    targetSnippet: "2ᵐ = N   ⟹   m = log₂(N)",
    terms: [
      { term: "m", definition: "Number of binary control/select lines" },
      { term: "N", definition: "Number of data input lines" },
    ],
    simpleExplanation:
      "To uniquely address and select one of N inputs, you need 'm' select lines such that 2 raised to the power of m equals N. Each combination of select bits addresses a unique input channel.",
    example:
      "For an 8:1 MUX: N = 8. Since 2³ = 8, exactly m = 3 select lines (S₂, S₁, S₀) are needed to address all 8 inputs (I₀ to I₇).",
    formulaOrDiagram: `Input Count (N)  |  Select Lines (m)  |  MUX Type
-------------------------------------------------
       2         |        1           |   2:1 MUX
       4         |        2           |   4:1 MUX
       8         |        3           |   8:1 MUX
      16         |        4           |  16:1 MUX`,
    diagramTitle: "Common MUX Capacity & Select Lines",
    deeperExplanation: {
      breakdown:
        "Binary numbers with m bits can represent 2ᵐ unique states (0 to 2ᵐ - 1). Each state corresponds to one input index. If N is not a power of 2, you must take the ceiling: m = ⌈log₂(N)⌉.",
      commonPitfalls: [
        "Confusing data lines with select lines (e.g. thinking an 8:1 MUX has 8 select lines instead of 3).",
      ],
      keyTakeaways: [
        "m control bits can route 2ᵐ data channels.",
        "Always verify which select line is MSB (e.g., Sₙ₋₁) and LSB (S₀).",
      ],
    },
  },

  "active-low-enable": {
    id: "active-low-enable",
    title: "Active-Low Enable Input (E' or EN)",
    category: "Hardware Pinout",
    targetSnippet: "EN = 0 (Active)  |  EN = 1 (Disabled, Y = 0)",
    terms: [
      { term: "Active-Low", definition: "A signal line that triggers functionality when at logic 0 (Low voltage)" },
      { term: "Bubble / Bar", definition: "Represented with a bar (E') or circle bubble on circuit schematics" },
    ],
    simpleExplanation:
      "An active-low enable pin means the chip is 'turned on' and functioning normally when the pin is pulled to 0V (ground). If the pin is at logic 1 (+5V), the entire IC is disabled and its output remains inactive (0 or High-Z).",
    example:
      "When cascading two 4:1 multiplexers to build an 8:1 multiplexer, use the third select line S₂ directly on the active-low enable pin of MUX 0, and invert S₂ before connecting to MUX 1.",
    formulaOrDiagram: `      +------------+
I₀-I₃ |            |
----->|  4:1 MUX   |-----> Y
S₁,S₀ |            |
----->|            |
      |   _EN (O)  |
      +-----+------+
            |
            +--- (0 = ON, 1 = OFF)`,
    diagramTitle: "Active-Low Gating Schematic",
    deeperExplanation: {
      breakdown:
        "Active-low logic is prevalent in digital ICs (TTL and CMOS) because pull-down driving transistors sink current faster and provide better noise immunity than active-high drivers.",
      commonPitfalls: [
        "Connecting EN to logic 1 (+Vcc) and wondering why the circuit produces no output.",
        "Failing to negate the enable logic when performing Boolean cascading derivations.",
      ],
      keyTakeaways: [
        "Active-low = Active when grounded (0).",
        "Look for the bubble symbol on the schematic pin.",
      ],
    },
  },

  "practice-hint-mux-residue": {
    id: "practice-hint-mux-residue",
    title: "Hint: Function Implementation using 4:1 MUX",
    category: "Problem Solving Strategy",
    targetSnippet: "F(A, B, C) = Σm(1, 3, 4, 6, 7) using A, B as select lines",
    terms: [
      { term: "Select Lines (A, B)", definition: "Connect A to S₁ (MSB) and B to S₀ (LSB)" },
      { term: "Residue Variable (C)", definition: "Examine output F for each AB combination as a function of C (0, 1, C, or C')" },
    ],
    simpleExplanation:
      "Do not try to solve the entire circuit at once. Break the 3-variable truth table into 4 pairs according to the select lines AB (00, 01, 10, 11). For each pair, compare output F with the input variable C.",
    example:
      "For AB = 00: Check m₀ (ABC=000, F=0) and m₁ (ABC=001, F=1). Notice F matches C exactly (F = C). Therefore, connect input I₀ = C.",
    formulaOrDiagram: `AB Pair | Minterms (ABC) | F Values | Residue Input to MUX
-----------------------------------------------------------
 00     | m₀(0), m₁(1)   | 0, 1     | I₀ = C
 01     | m₂(0), m₃(1)   | 0, 1     | I₁ = C
 10     | m₄(1), m₅(0)   | 1, 0     | I₂ = C'
 11     | m₆(1), m₇(1)   | 1, 1     | I₃ = 1 (Vcc)`,
    diagramTitle: "Residue Decomposition Strategy",
    isQuestionHint: true,
    deeperExplanation: {
      breakdown:
        "Any n-variable Boolean function can be implemented using a 2ⁿ⁻¹-to-1 MUX by choosing (n-1) variables as select lines and expressing the remaining 1 variable as 0, 1, C, or C' on the data inputs.",
      commonPitfalls: [
        "Attempting to map minterms directly without setting up the input residue table.",
        "Accidentally inverting C when F values are [1, 0] instead of [0, 1].",
      ],
      keyTakeaways: [
        "If F values are [0, 0] ⟹ Input = 0 (GND)",
        "If F values are [1, 1] ⟹ Input = 1 (VCC)",
        "If F values are [0, 1] ⟹ Input = C",
        "If F values are [1, 0] ⟹ Input = C'",
      ],
    },
  },

  "kmap-quad-wrapping": {
    id: "kmap-quad-wrapping",
    title: "K-Map Toroidal Wrap-Around & Corner Quads",
    category: "Revision & Mistake Resolution",
    targetSnippet: "Minterms m(0, 2, 8, 10) in 4-variable K-Map ⟹ Group = B'·D'",
    terms: [
      { term: "Corner Quad", definition: "Cells at top-left m(0), top-right m(2), bottom-left m(8), bottom-right m(10)" },
      { term: "Adjacency", definition: "Gray code layout means opposite edges wrap around like a cylinder/torus" },
    ],
    simpleExplanation:
      "In a 4-variable K-Map, the four outermost corner cells are all physically adjacent in Gray code coordinate space. Instead of grouping them as separate isolated pairs, they MUST be combined into a single group of 4 (quad).",
    example:
      "Cell coordinates: m(0) = 0000, m(2) = 0010, m(8) = 1000, m(10) = 1010. Notice A changes (0,1), B stays 0 (B'), C changes (0,1), D stays 0 (D'). Hence, the term reduces directly to B'D'.",
    formulaOrDiagram: `   CD  00    01    11    10
AB   +-----+-----+-----+-----+
00   | [1] |  0  |  0  | [1] |  <-- m(0) & m(2)
     +-----+-----+-----+-----+
01   |  0  |  0  |  0  |  0  |
     +-----+-----+-----+-----+
11   |  0  |  0  |  0  |  0  |
     +-----+-----+-----+-----+
10   | [1] |  0  |  0  | [1] |  <-- m(8) & m(10)
     +-----+-----+-----+-----+
       ^^                  ^^
       Corners combine into single Quad: B'D'`,
    diagramTitle: "4-Corner Quad Visualization",
    deeperExplanation: {
      breakdown:
        "Grouping larger powers of 2 (group of 4 instead of group of 2) eliminates TWO variables instead of one. Grouping them as 4 separate pairs would leave redundant terms and an un-minimized Boolean expression.",
      analogy:
        "Imagine folding the paper top-to-bottom into a cylinder, and then left-to-right into a donut (torus). All 4 corners touch each other at the single central seam.",
      commonPitfalls: [
        "Treating edges as hard physical boundaries and making 2 or 4 separate 2-cell groups.",
        "Including redundant prime implicants when a single quad covers all 4 minterms.",
      ],
      keyTakeaways: [
        "A group of 4 cells eliminates 2 variables.",
        "Always look for corner quads m(0,2,8,10) before making 2-cell pairs.",
      ],
    },
  },
};

export const getExplanationById = (id: string): ExplanationData | undefined => {
  return mockExplanations[id];
};

