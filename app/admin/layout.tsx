import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const managed = await roleService.listManagedBoardIds(session.user.id);
  if (managed !== "all" && managed.length === 0) {
    redirect("/?error=forbidden");
  }

  return <>{children}</>;
}
