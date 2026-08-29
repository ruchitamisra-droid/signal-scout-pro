import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/TierBadge";
import { LeadFormDialog } from "@/components/LeadFormDialog";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { deleteLead, fetchLeads, insertLeads, updateLead } from "@/lib/leads-api";
import {
  INDUSTRIES,
  leadsToCsv,
  outreachAngle,
  scoreLead,
  tierFor,
} from "@/lib/scoring";
import type { Lead, LeadInput, Tier } from "@/lib/scoring";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signal Scout — Lead Scoring for VEED GTM" },
      {
        name: "description",
        content:
          "Score and prioritise video-marketing-ready leads for VEED with signal-based ICP fit scoring and auto-generated outreach angles.",
      },
      { property: "og:title", content: "Signal Scout — Lead Scoring for VEED GTM" },
      {
        property: "og:description",
        content:
          "A prospecting dashboard that scores leads on video-marketing signals and writes the outreach angle for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type SortKey = "company" | "industry" | "employee_range" | "score";

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "hot" | "warm" | "cold" | "accent";
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    accent: "text-primary",
    hot: "text-hot",
    warm: "text-warm",
    cold: "text-muted-foreground",
  };
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const [tierFilter, setTierFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["leads"] });

  const addMutation = useMutation({
    mutationFn: (values: LeadInput) => insertLeads([values]),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      toast.success("Lead added and scored");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: LeadInput }) =>
      updateLead(id, values),
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditing(null);
      toast.success("Lead updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMutation = useMutation({
    mutationFn: (values: LeadInput[]) => insertLeads(values),
    onSuccess: (_d, values) => {
      invalidate();
      setImportOpen(false);
      toast.success(`${values.length} leads imported`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      invalidate();
      toast.success("Lead removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scored = useMemo(
    () =>
      leads.map((l) => {
        const score = scoreLead(l);
        return { ...l, score, tier: tierFor(score) as Tier, angle: outreachAngle(l) };
      }),
    [leads],
  );

  const stats = useMemo(() => {
    const total = scored.length;
    const hot = scored.filter((l) => l.tier === "Hot").length;
    const warm = scored.filter((l) => l.tier === "Warm").length;
    const cold = scored.filter((l) => l.tier === "Cold").length;
    const avg = total ? Math.round(scored.reduce((s, l) => s + l.score, 0) / total) : 0;
    return { total, hot, warm, cold, avg };
  }, [scored]);

  const visible = useMemo(() => {
    const rows = scored.filter(
      (l) =>
        (tierFilter === "all" || l.tier === tierFilter) &&
        (industryFilter === "all" || l.industry === industryFilter) &&
        (!search.trim() || l.company.toLowerCase().includes(search.trim().toLowerCase())),
    );
    const dir = sortAsc ? 1 : -1;
    return rows.sort((a, b) => {
      if (sortKey === "score") return (a.score - b.score) * dir;
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir;
    });
  }, [scored, tierFilter, industryFilter, search, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key !== "score");
    }
  };

  const exportCsv = () => {
    const csv = leadsToCsv(visible);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "signal-scout-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
    >
      {label}
      {sortKey === k &&
        (sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
    </button>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 accent-glow font-display text-base font-bold text-primary">
              S
            </span>
            <h1 className="text-3xl font-bold sm:text-4xl">Signal Scout</h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Find and score video-marketing-ready leads for VEED.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Bulk import
          </Button>
          <Button variant="secondary" onClick={exportCsv} disabled={visible.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add lead
          </Button>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total leads" value={stats.total} tone="accent" />
        <StatCard label="Hot" value={stats.hot} tone="hot" />
        <StatCard label="Warm" value={stats.warm} tone="warm" />
        <StatCard label="Cold" value={stats.cold} tone="cold" />
        <StatCard label="Avg. score" value={stats.avg} />
      </section>

      <section className="mt-6 panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex gap-3">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="Hot">Hot</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="Cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface-2/60">
              <tr className="text-left">
                <th className="px-4 py-3">
                  <SortHead label="Company" k="company" />
                </th>
                <th className="px-4 py-3">
                  <SortHead label="Industry" k="industry" />
                </th>
                <th className="px-4 py-3">
                  <SortHead label="Size" k="employee_range" />
                </th>
                <th className="px-4 py-3">
                  <SortHead label="Score" k="score" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Tier
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Outreach angle
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Loading leads…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-destructive">
                    Couldn't load leads. Try refreshing.
                  </td>
                </tr>
              )}
              {!isLoading && !error && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No leads match these filters.
                  </td>
                </tr>
              )}
              {visible.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border/70 align-top transition-colors hover:bg-surface-2/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.company}</div>
                    {lead.website && (
                      <a
                        href={`https://${lead.website.replace(/^https?:\/\//, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        {lead.website}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.industry}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.employee_range}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-primary">
                        {lead.score}
                      </span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${lead.score}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={lead.tier} />
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    {lead.angle}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${lead.company}`}
                        onClick={() => {
                          setEditing(lead);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${lead.company}`}
                        onClick={() => deleteMutation.mutate(lead.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 panel p-6">
        <h2 className="font-display text-lg font-semibold">About this project</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Built as a portfolio project for founding GTM / GTM sales roles — demonstrating
          ICP definition, signal-based lead scoring, and sales-ready messaging generation,
          using VEED's real customer profile as the example.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Scoring: publishes video +30 · runs paid ads +25 · in-house creative team +20 ·
          industry fit up to +15 · company size up to +10. Hot 75+, Warm 45–74, Cold below 45.
        </p>
      </footer>

      <LeadFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        onSubmit={async (values) => {
          if (editing) await editMutation.mutateAsync({ id: editing.id, values });
          else await addMutation.mutateAsync(values);
        }}
      />
      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={async (values) => {
          await importMutation.mutateAsync(values);
        }}
      />
    </main>
  );
}
