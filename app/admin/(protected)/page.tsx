import { logout } from "../actions";

export default function AdminPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg rounded-lg border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">BarberFox</p>
        <h1 className="mt-3 text-3xl font-bold">Admin</h1>
        <p className="mt-4 text-neutral-300">Você está autenticado.</p>
        <form action={logout} className="mt-8">
          <button
            className="rounded-md border border-neutral-600 px-4 py-2 font-semibold text-neutral-100 transition hover:border-orange-400 hover:text-orange-300"
            type="submit"
          >
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
