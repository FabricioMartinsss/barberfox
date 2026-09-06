import { createClient } from "@/lib/supabase/server";

const connectivityProbeToken = "stage-1-connectivity-probe";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser(connectivityProbeToken);

    // getUser() sempre consulta o Auth. Uma rejeição de token malformado confirma a comunicação
    // sem exigir conta, tabela, schema ou credencial administrativa.
    if (error?.code === "bad_jwt") {
      return Response.json(
        { status: "ok", service: "supabase" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    // A resposta pública não expõe URL, chave ou detalhes da infraestrutura.
  }

  return Response.json(
    { status: "unavailable", service: "supabase" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
