import { redirect } from "next/navigation";

import { hasAuthenticatedAdmin } from "@/lib/supabase/auth";

import { login } from "../actions";
import { SubmitButton } from "./submit-button";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await hasAuthenticatedAdmin()) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const hasInvalidCredentials = error === "invalid-credentials";

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">BarberFox</p>
        <h1 className="mt-3 text-2xl font-bold">Acesso administrativo</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          Entre com a conta administrativa cadastrada.
        </p>

        <form action={login} className="mt-6 space-y-4">
          <label className="block text-sm font-medium" htmlFor="email">
            Email
            <input
              autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-base outline-none ring-orange-400 focus:ring-2"
              id="email"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="block text-sm font-medium" htmlFor="password">
            Senha
            <input
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-base outline-none ring-orange-400 focus:ring-2"
              id="password"
              name="password"
              minLength={1}
              required
              type="password"
            />
          </label>

          {hasInvalidCredentials ? (
            <p aria-live="polite" className="text-sm text-red-300" role="alert">
              Email ou senha inválidos.
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </section>
    </main>
  );
}
