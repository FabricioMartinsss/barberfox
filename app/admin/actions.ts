"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const invalidCredentialsPath = "/admin/login?error=invalid-credentials";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(invalidCredentialsPath);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(invalidCredentialsPath);
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
