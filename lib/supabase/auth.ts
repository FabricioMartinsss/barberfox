import { createClient } from "./server";

export async function createAuthenticatedAdminClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  return !error && data?.claims?.sub ? supabase : null;
}

/**
 * Valida a assinatura e as claims do JWT recebido nos cookies. Não usa
 * getSession(), pois a sessão lida do cookie não é uma prova de identidade.
 */
export async function hasAuthenticatedAdmin(): Promise<boolean> {
  return Boolean(await createAuthenticatedAdminClient());
}
