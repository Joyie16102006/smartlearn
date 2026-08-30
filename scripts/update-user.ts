import { prisma } from "../lib/db";

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);
  for (const u of users) {
    const updated = await prisma.user.update({
      where: { id: u.id },
      data: {
        name: "Vitian",
        email: "student@vitapstudent.ac.in",
        avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Vitian&backgroundColor=18181b&textColor=ffffff",
      },
    });
    console.log(`Updated user ${updated.id}: Name="${updated.name}", Email="${updated.email}"`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
