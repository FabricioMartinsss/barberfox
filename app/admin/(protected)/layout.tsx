import { redirect } from "next/navigation";

import { hasAuthenticatedAdmin } from "@/lib/supabase/auth";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasAuthenticatedAdmin())) {
    redirect("/admin/login");
  }

  return children;
}
