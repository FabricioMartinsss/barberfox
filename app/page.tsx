export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg border-l-4 border-orange-500 pl-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
          Etapa 0 · Fundação técnica
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Barberfox</h1>
        <p className="mt-5 text-base leading-relaxed text-neutral-300">
          A base do projeto está no ar. Esta página valida a aplicação antes do
          desenvolvimento das funcionalidades da barbearia.
        </p>
        <p className="mt-6 text-sm text-neutral-400">Next.js · vinext · Cloudflare Workers</p>
      </section>
    </main>
  );
}
