import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create permissions
  const allPermission = await prisma.permission.upsert({
    where: { name: "all:all" },
    update: {},
    create: {
      name: "all:all",
      description: "모든 권한",
    },
  });

  await prisma.permission.upsert({
    where: { name: "admin:read" },
    update: {},
    create: {
      name: "admin:read",
      description: "관리자 페이지 읽기",
    },
  });

  const foreignWritePermission = await prisma.permission.upsert({
    where: { name: "foreign:write" },
    update: {},
    create: {
      name: "foreign:write",
      description: "외국인 쓰기 권한",
    },
  });

  // Create ADMIN role
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "관리자",
    },
  });

  // Assign all:all permission to ADMIN role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: allPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: allPermission.id,
    },
  });

  // Create FOREIGNER role
  const foreignerRole = await prisma.role.upsert({
    where: { name: "FOREIGNER" },
    update: {},
    create: {
      name: "FOREIGNER",
      description: "외국인",
    },
  });

  // Assign foreign:write permission to FOREIGNER role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: foreignerRole.id,
        permissionId: foreignWritePermission.id,
      },
    },
    update: {},
    create: {
      roleId: foreignerRole.id,
      permissionId: foreignWritePermission.id,
    },
  });

  console.log("Seed completed:");
  console.log("- Permissions: all:all, admin:read, foreign:write");
  console.log("- Role: ADMIN (with all:all), FOREIGNER (with foreign:write)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
