import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkUserPermission } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasAccess = await checkUserPermission(session.user.id, "admin:read");

  if (!hasAccess) {
    redirect("/dashboard?error=forbidden");
  }

  return <>{children}</>;
}
