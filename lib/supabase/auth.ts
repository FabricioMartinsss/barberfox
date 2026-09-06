import { createClient } from "./server";

/**
 * Valida a assinatura e as claims do JWT recebido nos cookies. Não usa
 * getSession(), pois a sessão lida do cookie não é uma prova de identidade.
 */
export async function hasAuthenticatedAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  return !error && Boolean(data?.claims?.sub);
}
