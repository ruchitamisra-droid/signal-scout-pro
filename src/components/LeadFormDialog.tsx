import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EMPLOYEE_RANGES, INDUSTRIES, scoreLead, tierFor } from "@/lib/scoring";
import type { Lead, LeadInput } from "@/lib/scoring";
import { TierBadge } from "./TierBadge";

const empty: LeadInput = {
  company: "",
  website: "",
  industry: "Agency",
  employee_range: "11-50",
  runs_paid_ads: false,
  publishes_video: false,
  in_house_team: false,
};

export function LeadFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Lead | null;
  onSubmit: (values: LeadInput) => Promise<void>;
}) {
  const [values, setValues] = useState<LeadInput>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      editing
        ? {
            company: editing.company,
            website: editing.website ?? "",
            industry: editing.industry,
            employee_range: editing.employee_range,
            runs_paid_ads: editing.runs_paid_ads,
            publishes_video: editing.publishes_video,
            in_house_team: editing.in_house_team,
          }
        : empty,
    );
  }, [open, editing]);

  const score = scoreLead(values);

  const set = <K extends keyof LeadInput>(key: K, v: LeadInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const toggles: { key: keyof LeadInput; label: string; hint: string }[] = [
    {
      key: "runs_paid_ads",
      label: "Runs paid social / video ads",
      hint: "+25 — needs constant creative variants",
    },
    {
      key: "publishes_video",
      label: "Publishes video regularly",
      hint: "+30 — YouTube / TikTok / Instagram cadence",
    },
    {
      key: "in_house_team",
      label: "Has in-house marketing or creative team",
      hint: "+20 — someone to own the tool",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit lead" : "Add a lead"}
          </DialogTitle>
          <DialogDescription>
            Signals score instantly against the VEED ICP.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!values.company.trim()) return;
            setSaving(true);
            try {
              await onSubmit({ ...values, company: values.company.trim() });
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              value={values.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Northbeam Creative"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={values.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="northbeamcreative.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Industry</Label>
              <Select
                value={values.industry}
                onValueChange={(v) => set("industry", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Employee count</Label>
              <Select
                value={values.employee_range}
                onValueChange={(v) => set("employee_range", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {toggles.map((t) => (
              <label
                key={t.key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5"
              >
                <span>
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.hint}</span>
                </span>
                <Switch
                  checked={values[t.key] as boolean}
                  onCheckedChange={(v) => set(t.key, v as never)}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            <span className="text-sm text-muted-foreground">Live ICP Fit Score</span>
            <span className="flex items-center gap-3">
              <span className="font-display text-2xl font-bold text-primary">{score}</span>
              <TierBadge tier={tierFor(score)} />
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
