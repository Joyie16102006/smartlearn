import {
  Course,
  DailyMission,
  ConceptMastery,
  MistakeLog,
  ResourceItem,
  AssessmentResult,
  UserProfile,
  DayPlan,
} from "@/types";

export const mockUserProfile: UserProfile = {
  name: "Vitian",
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Vitian&backgroundColor=18181b&textColor=ffffff",
  email: "student@vitapstudent.ac.in",
  streakDays: 0,
  totalHoursLearned: 0,
  overallMasteryPercentage: 0,
  activeCoursesCount: 0,
};


export const mockCourses: Course[] = [];
export const mockDigitalElectronicsDays: DayPlan[] = [];
export const mockPythonDays: DayPlan[] = [];
export const mockDataStructuresDays: DayPlan[] = [];
export const mockComputerArchitectureDays: DayPlan[] = [];
export const mockDigitalElectronicsCourse: Course | null = null;
export const mockPythonCourse: Course | null = null;
export const mockDataStructuresCourse: Course | null = null;
export const mockComputerArchitectureCourse: Course | null = null;
export const mockDailyMissions: DailyMission[] = [];
export const mockConceptMasteryList: ConceptMastery[] = [];
export const mockMistakeLogs: MistakeLog[] = [];
export const mockResources: ResourceItem[] = [];
export const mockAssessmentResults: AssessmentResult[] = [];
