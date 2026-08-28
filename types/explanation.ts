export interface TermDefinition {
  term: string;
  definition: string;
}

export interface DeeperExplanation {
  breakdown: string;
  analogy?: string;
  commonPitfalls?: string[];
  keyTakeaways?: string[];
}

export interface ExplanationData {
  id: string;
  title: string;
  category?: string;
  targetSnippet?: string;
  terms?: TermDefinition[];
  simpleExplanation: string;
  example?: string;
  formulaOrDiagram?: string;
  diagramTitle?: string;
  isQuestionHint?: boolean;
  deeperExplanation: DeeperExplanation;
}

