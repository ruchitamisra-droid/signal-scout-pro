import type { Tier } from "@/lib/scoring";

const styles: Record<Tier, string> = {
  Hot: "bg-hot/15 text-hot border-hot/40",
  Warm: "bg-warm/15 text-warm border-warm/40",
  Cold: "bg-cold/25 text-cold-foreground border-border",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[tier]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {tier}
    </span>
  );
}
