export type KnowledgeLevel = "Beginner" | "Intermediate" | "Advanced";

export type ConceptStatus = "completed" | "current" | "upcoming" | "weak";

export type ResourceType = "video" | "article" | "documentation" | "uploaded";

export interface ConceptNode {
  id: string;
  name: string;
  slug: string;
  status: ConceptStatus;
  masteryPercentage: number;
  importance: "high" | "medium" | "low";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  description: string;
  prerequisites: string[]; // ids of prerequisite concepts
  keyFormulas?: string[];
  dayAssigned?: number;
}

export interface DayPlan {
  dayNumber: number;
  title: string;
  conceptId: string;
  status: "completed" | "current" | "locked";
  topicsCovered: string[];
  durationMinutes: number;
  quizScore?: number;
  hasMistake?: boolean;
  mistakeConcept?: string;
  revisionNote?: string;
  sourceLink?: {
    title: string;
    source: string;
    url: string;
    duration: string;
  };
}

export interface Course {
  id: string;
  title: string;
  category: string;
  goal: string;
  currentLevel: KnowledgeLevel;
  totalDays: number;
  currentDay: number;
  progressPercentage: number;
  minutesPerDay: number;
  preferredTime: string;
  currentTopic: string;
  nextSessionTime: string;
  nextSessionTopic: string;
  description: string;
  concepts: ConceptNode[];
  daysList?: DayPlan[];
  materialsCount: number;
  streakDays: number;
}

export interface MissionSection {
  id: string;
  type: "learn" | "resource" | "practice" | "quiz" | "revision";
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  status: "ready" | "in-progress" | "completed" | "locked";
  actionLabel: string;
  resourceDetails?: {
    type: string;
    source: string;
    url?: string;
  };
}

export interface DailyMission {
  id: string;
  courseId: string;
  courseTitle: string;
  currentDay: number;
  totalDays: number;
  todayTopic: string;
  totalMinutes: number;
  scheduledTime: string;
  completedMinutes: number;
  sections: MissionSection[];
}

export interface ConceptMastery {
  id: string;
  conceptName: string;
  category: string;
  masteryPercentage: number;
  categoryType: "strong" | "needs-practice" | "weak";
  breakdown: {
    mcqScore: number;
    problemSolvingScore: number;
    explanationScore: number;
    weeklyTestScore: number;
  };
  lastReviewedDaysAgo: number;
  nextReviewDays: number;
  commonMistakes: string[];
  attemptsCount: number;
  confidenceScore: number;
}

export interface MistakeLog {
  id: string;
  conceptId: string;
  conceptName: string;
  questionTitle: string;
  userAnswer: string;
  correctAnswer: string;
  errorType: string;
  severity: "high" | "medium" | "low";
  likelyCause: string;
  adaptiveAction: string;
  timestamp: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  durationMinutes?: number;
  difficulty: KnowledgeLevel;
  source: string;
  conceptName: string;
  whyRecommended: string;
  url?: string;
  rating: number;
  isBookmarked?: boolean;
}

export interface AssessmentResult {
  id: string;
  title: string;
  type: "daily" | "weekly" | "diagnostic";
  courseTitle: string;
  completedAt: string;
  scorePercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  strongConcept: string;
  weakConcept: string;
  improvementDeltaPercentage: number;
  timeSpentMinutes: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  email: string;
  streakDays: number;
  totalHoursLearned: number;
  overallMasteryPercentage: number;
  activeCoursesCount: number;
}
