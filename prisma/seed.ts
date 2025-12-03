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

  console.log("Seed completed:");
  console.log("- Permissions: all:all, admin:read");
  console.log("- Role: ADMIN (with all:all)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
