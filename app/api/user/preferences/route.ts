import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/user/preferences
 * Returns the current user profile and preferences from Supabase database.
 */
export async function GET() {
  try {
    let user = await prisma.user.findFirst({
      include: {
        preferences: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: "user-default",
          name: "Vitian",
          email: "student@vitapstudent.ac.in",
          preferences: {
            create: {
              preferredTime: "6:00 PM",
              preferredDailyMinutes: 60,
              learningStyle: "visual-practice",
            },
          },
        },
        include: {
          preferences: true,
        },
      });
    }

    return NextResponse.json({
      name: user.name || "Vitian",
      email: user.email || "student@vitapstudent.ac.in",
      avatarUrl: user.avatarUrl,
      streakDays: user.streakDays,
      totalHoursLearned: user.totalHoursLearned,
      overallMasteryPercentage: user.overallMasteryPercentage,
      activeCoursesCount: user.activeCoursesCount,
      preferredTime: user.preferences?.preferredTime || "6:00 PM",
      dailyDuration: user.preferences?.preferredDailyMinutes || 60,
      learningStyle: user.preferences?.learningStyle || "visual-practice",
    });
  } catch (error: any) {
    console.error("GET /api/user/preferences error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

/**
 * PUT /api/user/preferences
 * Updates user profile and preferences in Supabase database.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, email, preferredTime, dailyDuration, learningStyle } = body;

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: "user-default",
          name: name || "Vitian",
          email: email || "student@vitapstudent.ac.in",
        },
      });
    }


    // Update user display name & email
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : user.name,
        email: email !== undefined ? email : user.email,
      },
    });

    // Upsert preferences
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferredTime: preferredTime || "6:00 PM",
        preferredDailyMinutes: Number(dailyDuration) || 60,
        learningStyle: learningStyle || "visual-practice",
      },
      update: {
        preferredTime: preferredTime || undefined,
        preferredDailyMinutes: dailyDuration ? Number(dailyDuration) : undefined,
        learningStyle: learningStyle || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      preferences: updatedPreferences,
    });
  } catch (error: any) {
    console.error("PUT /api/user/preferences error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}

