


// prisma/seed.ts
import { PrismaClient, Role, MatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Secure Admin User
  const adminEmail = "admin.nexar@cricketbet.com";
  const adminPlainPassword = "Cb@2026Secure!X9";
  const adminPassword = await bcrypt.hash(adminPlainPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "CricketBet Super Admin",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      name: "CricketBet Super Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // Optional Test User
  const testUserEmail = "test@cricketbet.com";
  const testUserPassword = await bcrypt.hash("User@2026Test", 12);

  await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {},
    create: {
      email: testUserEmail,
      name: "Test User",
      passwordHash: testUserPassword,
      role: Role.USER,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // Sample Matches
  const now = new Date();

  const match1 = await prisma.match.upsert({
    where: { id: "match-001" },
    update: {},
    create: {
      id: "match-001",
      title: "India vs Australia - 1st T20I",
      teamA: "India",
      teamB: "Australia",
      venue: "Wankhede Stadium, Mumbai",
      series: "India vs Australia T20I Series 2025",
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      status: MatchStatus.UPCOMING,
      tossOdds: 1.95,
    },
  });

  const match2 = await prisma.match.upsert({
    where: { id: "match-002" },
    update: {},
    create: {
      id: "match-002",
      title: "CSK vs MI - IPL Match 12",
      teamA: "Chennai Super Kings",
      teamB: "Mumbai Indians",
      venue: "MA Chidambaram Stadium, Chennai",
      series: "IPL 2025",
      startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      status: MatchStatus.UPCOMING,
      tossOdds: 1.95,
    },
  });

  const match3 = await prisma.match.upsert({
    where: { id: "match-003" },
    update: {},
    create: {
      id: "match-003",
      title: "RCB vs KKR - IPL Match 13",
      teamA: "Royal Challengers Bengaluru",
      teamB: "Kolkata Knight Riders",
      venue: "M. Chinnaswamy Stadium, Bengaluru",
      series: "IPL 2025",
      startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      status: MatchStatus.LIVE,
      tossOdds: 1.95,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   Admin Email: ${adminEmail}`);
  console.log(`   Admin Password: ${adminPlainPassword}`);
  console.log(`   Test User: ${testUserEmail} / User@2026Test`);
  console.log(
    `   Matches created: ${match1.title}, ${match2.title}, ${match3.title}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
