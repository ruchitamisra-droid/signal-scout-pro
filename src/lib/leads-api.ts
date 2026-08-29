import { supabase } from "@/integrations/supabase/client";
import type { Lead, LeadInput } from "./scoring";

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, company, website, industry, employee_range, runs_paid_ads, publishes_video, in_house_team, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function insertLeads(leads: LeadInput[]): Promise<void> {
  const { error } = await supabase.from("leads").insert(leads);
  if (error) throw error;
}

export async function updateLead(id: string, lead: LeadInput): Promise<void> {
  const { error } = await supabase.from("leads").update(lead).eq("id", id);
  if (error) throw error;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
