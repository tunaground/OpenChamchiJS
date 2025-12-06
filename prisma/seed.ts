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

  // Board permissions
  await prisma.permission.upsert({
    where: { name: "board:all" },
    update: {},
    create: {
      name: "board:all",
      description: "보드 모든 권한",
    },
  });

  await prisma.permission.upsert({
    where: { name: "board:write" },
    update: {},
    create: {
      name: "board:write",
      description: "보드 생성",
    },
  });

  await prisma.permission.upsert({
    where: { name: "board:edit" },
    update: {},
    create: {
      name: "board:edit",
      description: "보드 모든 필드 수정",
    },
  });

  await prisma.permission.upsert({
    where: { name: "board:config" },
    update: {},
    create: {
      name: "board:config",
      description: "보드 설정값만 수정",
    },
  });

  // Thread permissions (global)
  await prisma.permission.upsert({
    where: { name: "thread:all" },
    update: {},
    create: {
      name: "thread:all",
      description: "모든 보드의 스레드 전체 권한",
    },
  });

  await prisma.permission.upsert({
    where: { name: "thread:edit" },
    update: {},
    create: {
      name: "thread:edit",
      description: "모든 보드의 스레드 수정",
    },
  });

  await prisma.permission.upsert({
    where: { name: "thread:delete" },
    update: {},
    create: {
      name: "thread:delete",
      description: "모든 보드의 스레드 삭제",
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
  console.log("- Board permissions: board:all, board:write, board:edit, board:config");
  console.log("- Thread permissions: thread:all, thread:edit, thread:delete");
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
