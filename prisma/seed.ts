import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Global permissions
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
    where: { name: "board:read" },
    update: {},
    create: {
      name: "board:read",
      description: "보드 목록 조회",
    },
  });

  await prisma.permission.upsert({
    where: { name: "board:create" },
    update: {},
    create: {
      name: "board:create",
      description: "보드 생성",
    },
  });

  await prisma.permission.upsert({
    where: { name: "board:update" },
    update: {},
    create: {
      name: "board:update",
      description: "보드 수정",
    },
  });

  // Thread permissions (global)
  await prisma.permission.upsert({
    where: { name: "thread:update" },
    update: {},
    create: {
      name: "thread:update",
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

  // Response permissions (global)
  await prisma.permission.upsert({
    where: { name: "response:update" },
    update: {},
    create: {
      name: "response:update",
      description: "모든 보드의 응답 수정",
    },
  });

  await prisma.permission.upsert({
    where: { name: "response:delete" },
    update: {},
    create: {
      name: "response:delete",
      description: "모든 보드의 응답 삭제",
    },
  });

  // Notice permissions
  await prisma.permission.upsert({
    where: { name: "notice:create" },
    update: {},
    create: {
      name: "notice:create",
      description: "공지사항 생성",
    },
  });

  await prisma.permission.upsert({
    where: { name: "notice:update" },
    update: {},
    create: {
      name: "notice:update",
      description: "공지사항 수정",
    },
  });

  await prisma.permission.upsert({
    where: { name: "notice:delete" },
    update: {},
    create: {
      name: "notice:delete",
      description: "공지사항 삭제",
    },
  });

  // User permissions
  await prisma.permission.upsert({
    where: { name: "user:read" },
    update: {},
    create: {
      name: "user:read",
      description: "사용자 목록 조회",
    },
  });

  await prisma.permission.upsert({
    where: { name: "user:update" },
    update: {},
    create: {
      name: "user:update",
      description: "사용자 정보 수정",
    },
  });

  await prisma.permission.upsert({
    where: { name: "user:delete" },
    update: {},
    create: {
      name: "user:delete",
      description: "사용자 삭제",
    },
  });

  // Role permissions
  await prisma.permission.upsert({
    where: { name: "role:read" },
    update: {},
    create: {
      name: "role:read",
      description: "역할 목록 조회",
    },
  });

  await prisma.permission.upsert({
    where: { name: "role:create" },
    update: {},
    create: {
      name: "role:create",
      description: "역할 생성",
    },
  });

  await prisma.permission.upsert({
    where: { name: "role:update" },
    update: {},
    create: {
      name: "role:update",
      description: "역할 수정 및 권한 바인딩",
    },
  });

  await prisma.permission.upsert({
    where: { name: "role:delete" },
    update: {},
    create: {
      name: "role:delete",
      description: "역할 삭제",
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
  console.log("- Global: all:all, admin:read, foreign:write");
  console.log("- Board: board:read, board:create, board:update");
  console.log("- Thread: thread:update, thread:delete");
  console.log("- Response: response:update, response:delete");
  console.log("- Notice: notice:create, notice:update, notice:delete");
  console.log("- User: user:read, user:update, user:delete");
  console.log("- Role: role:read, role:create, role:update, role:delete");
  console.log("- Roles: ADMIN (with all:all), FOREIGNER (with foreign:write)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
