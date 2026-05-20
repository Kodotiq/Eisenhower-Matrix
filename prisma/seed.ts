import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();

  await prisma.task.createMany({
    data: [
      {
        title: "5 Daily Prayers",
        urgency: "High",
        importance: "High",
      },
      {
        title: "Operations Department Core Tasks (07:30 - 15:30)",
        urgency: "High",
        importance: "High",
      },
      {
        title: "Gym / Training Session (16:30 - 17:30)",
        urgency: "Low",
        importance: "High",
      },
      {
        title: "Skill Building: Python/SQL Pipeline",
        urgency: "Low",
        importance: "High",
      },
      {
        title: "Read Quran (21:00 - 21:30)",
        urgency: "Low",
        importance: "High",
      },
      {
        title: "Unplanned Office Interruptions",
        urgency: "High",
        importance: "Low",
      },
      {
        title: "Scrolling Social Media Post-Work",
        urgency: "Low",
        importance: "Low",
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
