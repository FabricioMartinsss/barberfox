"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthenticatedAdminClient } from "@/lib/supabase/auth";

const path = "/admin/services";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never { redirect(`${path}?error=${message}`); }
function value(formData: FormData, name: string) { return String(formData.get(name) ?? "").trim(); }
function priceToCents(input: string) {
  const match = input.replace(/^R\$\s*/i, "").match(/^(\d+)(?:,(\d{1,2}))?$/);
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
function serviceInput(formData: FormData) {
  const name = value(formData, "name");
  const description = value(formData, "description");
  const price_cents = priceToCents(value(formData, "price"));
  const duration_minutes = Number(value(formData, "duration"));
  if (!name || name.length > 100 || description.length > 500 || !price_cents || !Number.isInteger(duration_minutes) || duration_minutes < 15 || duration_minutes > 240) invalid("validation");
  return { name, description: description || null, price_cents, duration_minutes };
}
async function admin() { const client = await createAuthenticatedAdminClient(); if (!client) redirect("/admin/login"); return client; }
function databaseError(code?: string) { return code === "23505" ? "duplicate" : "save"; }

export async function createService(formData: FormData) {
  const supabase = await admin();
  const { error } = await supabase.from("services").insert(serviceInput(formData));
  if (error) invalid(databaseError(error.code));
  revalidatePath(path); redirect(`${path}?message=created`);
}
export async function updateService(formData: FormData) {
  const id = value(formData, "id"); if (!uuid.test(id)) invalid("save");
  const supabase = await admin();
  const { error } = await supabase.from("services").update(serviceInput(formData)).eq("id", id);
  if (error) invalid(databaseError(error.code));
  revalidatePath(path); redirect(`${path}?message=updated`);
}
export async function toggleService(formData: FormData) {
  const id = value(formData, "id"); const active = value(formData, "active") === "true";
  if (!uuid.test(id)) invalid("save");
  const supabase = await admin(); const { error } = await supabase.from("services").update({ active }).eq("id", id);
  if (error) invalid("save"); revalidatePath(path); redirect(`${path}?message=${active ? "activated" : "deactivated"}`);
}
