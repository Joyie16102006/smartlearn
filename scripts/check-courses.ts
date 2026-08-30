import { prisma } from "../lib/db";

async function main() {
  const users = await prisma.user.findMany({
    include: {
      courses: {
        select: { id: true, title: true, currentDay: true, userId: true, createdAt: true }
      }
    }
  });
  console.log("=== USERS & THEIR COURSES ===");
  console.log(JSON.stringify(users, null, 2));

  const allCourses = await prisma.course.findMany({
    select: { id: true, title: true, userId: true, currentDay: true, createdAt: true }
  });
  console.log("=== ALL COURSES IN DB ===");
  console.log(JSON.stringify(allCourses, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
