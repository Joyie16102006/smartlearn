import { LessonService } from "../lib/ai/services/lessonService";
import { prisma } from "../lib/db";

async function main() {
  const course = await prisma.course.findFirst({
    include: {
      daysList: {
        where: { dayNumber: 1 },
        include: { concept: true }
      }
    }
  });

  if (!course || course.daysList.length === 0) {
    console.log("No course or day 1 found.");
    return;
  }

  console.log("Testing generation for course:", course.title, "Day 1:", course.daysList[0].title);
  const result = await LessonService.getOrCreateLesson({
    courseId: course.id,
    dayNumber: 1,
    forceRegenerate: true,
  });

  console.log("=== GENERATED LESSON (Tail 800 chars) ===");
  console.log(result.markdownContent.slice(-800));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
