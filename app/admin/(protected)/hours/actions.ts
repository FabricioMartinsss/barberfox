"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthenticatedAdminClient } from "@/lib/supabase/auth";
const path = "/admin/hours";
const uuid = /^[0-9a-f-]{36}$/i;
function fail(error: string): never { redirect(`${path}?error=${error}`); }
function time(value: string) { return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value); }
function input(form: FormData) { const weekday = Number(form.get("weekday")); const starts_at = String(form.get("starts_at") ?? ""); const ends_at = String(form.get("ends_at") ?? ""); if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !time(starts_at) || !time(ends_at) || starts_at >= ends_at) fail("validation"); return { weekday, starts_at, ends_at }; }
async function admin() { const client = await createAuthenticatedAdminClient(); if (!client) redirect("/admin/login"); return client; }
function message(code?: string) { return code === "23P01" ? "conflict" : "save"; }
export async function createHours(form: FormData) { const supabase = await admin(); const { error } = await supabase.from("business_hours").insert(input(form)); if (error) fail(message(error.code)); revalidatePath(path); redirect(`${path}?message=created`); }
export async function updateHours(form: FormData) { const id = String(form.get("id") ?? ""); if (!uuid.test(id)) fail("save"); const supabase = await admin(); const { error } = await supabase.from("business_hours").update(input(form)).eq("id", id); if (error) fail(message(error.code)); revalidatePath(path); redirect(`${path}?message=updated`); }
export async function deleteHours(form: FormData) { const id = String(form.get("id") ?? ""); if (!uuid.test(id)) fail("save"); const supabase = await admin(); const { error } = await supabase.from("business_hours").delete().eq("id", id); if (error) fail("save"); revalidatePath(path); redirect(`${path}?message=deleted`); }
