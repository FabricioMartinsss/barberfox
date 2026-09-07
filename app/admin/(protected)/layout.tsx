import { redirect } from "next/navigation";
import Link from "next/link";

import { hasAuthenticatedAdmin } from "@/lib/supabase/auth";
import { logout } from "../actions";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasAuthenticatedAdmin())) {
    redirect("/admin/login");
  }

  return <><header className="border-b border-neutral-800 px-4 py-3"><nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 text-sm"><Link href="/admin">Início</Link><Link href="/admin/services">Serviços</Link><Link href="/admin/hours">Horários</Link><form action={logout} className="ml-auto"><button type="submit">Sair</button></form></nav></header>{children}</>;
}
