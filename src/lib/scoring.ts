export const INDUSTRIES = [
  "Agency",
  "E-commerce",
  "SaaS",
  "Media/Entertainment",
  "Enterprise",
  "Other",
] as const;

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type EmployeeRange = (typeof EMPLOYEE_RANGES)[number];

export type Lead = {
  id: string;
  company: string;
  website: string | null;
  industry: string;
  employee_range: string;
  runs_paid_ads: boolean;
  publishes_video: boolean;
  in_house_team: boolean;
  created_at?: string;
};

export type LeadInput = Omit<Lead, "id" | "created_at">;

export type Tier = "Hot" | "Warm" | "Cold";

const INDUSTRY_POINTS: Record<string, number> = {
  Agency: 15,
  "Media/Entertainment": 15,
  "E-commerce": 13,
  Enterprise: 9,
  SaaS: 6,
  Other: 4,
};

const SIZE_POINTS: Record<string, number> = {
  "1-10": 4,
  "11-50": 10,
  "51-200": 10,
  "201-1000": 7,
  "1000+": 5,
};

export function scoreLead(lead: Pick<Lead, "industry" | "employee_range" | "runs_paid_ads" | "publishes_video" | "in_house_team">): number {
  let score = 0;
  if (lead.publishes_video) score += 30;
  if (lead.runs_paid_ads) score += 25;
  if (lead.in_house_team) score += 20;
  score += INDUSTRY_POINTS[lead.industry] ?? 4;
  score += SIZE_POINTS[lead.employee_range] ?? 4;
  return Math.max(0, Math.min(100, score));
}

export function tierFor(score: number): Tier {
  if (score >= 75) return "Hot";
  if (score >= 45) return "Warm";
  return "Cold";
}

export function outreachAngle(lead: Lead): string {
  const name = lead.company;
  const parts: string[] = [];

  if (lead.publishes_video) {
    parts.push(
      "auto-subtitles and one-click multi-language translation to scale every upload across channels",
    );
  }
  if (lead.runs_paid_ads) {
    parts.push("AI avatars and text-to-video to spin up dozens of ad variants for testing without a shoot");
  }
  if (lead.industry === "Agency") {
    parts.push("Brand Kits so every client's videos stay on-brand without manual rework");
  } else if (lead.industry === "Media/Entertainment") {
    parts.push("the Magic Cut and clip-to-social workflow for turning long-form footage into shorts");
  } else if (lead.industry === "E-commerce") {
    parts.push("AI avatars plus background removal for product videos that ship in hours, not weeks");
  } else if (lead.industry === "Enterprise") {
    parts.push("workspaces, approvals and Brand Kits for governed video production across teams");
  }
  if (lead.in_house_team && parts.length < 3) {
    parts.push("VEED's collaborative editor so the in-house team drafts, comments and ships in one place");
  }

  if (parts.length === 0) {
    return `${name} isn't showing strong video signals yet — lead with a light-touch intro to VEED's AI video editor and how teams start with simple screen recordings and auto-subtitles.`;
  }

  const chosen = parts.slice(0, 2);
  const body = chosen.length === 1 ? chosen[0] : `${chosen[0]}, plus ${chosen[1]}`;
  const opener = lead.publishes_video
    ? `${name} already publishes video consistently`
    : lead.runs_paid_ads
      ? `${name} is actively buying paid social`
      : `${name} has the team in place to produce video`;

  return `${opener} — open with ${body}.`;
}

export function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function leadsToCsv(leads: Lead[]): string {
  const header = [
    "Company",
    "Website",
    "Industry",
    "Employee Count",
    "Runs Paid Ads",
    "Publishes Video",
    "In-House Team",
    "ICP Fit Score",
    "Tier",
    "Outreach Angle",
  ];
  const rows = leads.map((l) => {
    const score = scoreLead(l);
    return [
      l.company,
      l.website ?? "",
      l.industry,
      l.employee_range,
      l.runs_paid_ads ? "Yes" : "No",
      l.publishes_video ? "Yes" : "No",
      l.in_house_team ? "Yes" : "No",
      String(score),
      tierFor(score),
      outreachAngle(l),
    ].map(csvEscape);
  });
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const truthy = new Set(["yes", "y", "true", "1", "t"]);

function normalizeIndustry(raw: string): string {
  const v = raw.trim().toLowerCase();
  const match = INDUSTRIES.find((i) => i.toLowerCase() === v);
  if (match) return match;
  if (v.includes("agenc")) return "Agency";
  if (v.includes("commerce") || v.includes("retail") || v.includes("shop")) return "E-commerce";
  if (v.includes("saas") || v.includes("software")) return "SaaS";
  if (v.includes("media") || v.includes("entertain")) return "Media/Entertainment";
  if (v.includes("enterprise")) return "Enterprise";
  return "Other";
}

function normalizeRange(raw: string): string {
  const v = raw.trim().toLowerCase().replace(/\s|employees?/g, "");
  const match = EMPLOYEE_RANGES.find((r) => r.toLowerCase() === v);
  if (match) return match;
  if (v.includes("1000+") || v.includes("1001")) return "1000+";
  if (v.includes("201")) return "201-1000";
  if (v.includes("51")) return "51-200";
  if (v.includes("11")) return "11-50";
  return "1-10";
}

export type ParseResult = { leads: LeadInput[]; errors: string[] };

export function parseCsv(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { leads: [], errors: ["Nothing to import."] };

  let start = 0;
  const first = splitCsvLine(lines[0] ?? "").map((c) => c.toLowerCase());
  if (first[0]?.includes("company")) start = 1;

  const leads: LeadInput[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i] ?? "");
    const company = cells[0];
    if (!company) {
      errors.push(`Row ${i + 1}: missing company name — skipped.`);
      continue;
    }
    leads.push({
      company,
      website: cells[1] || null,
      industry: normalizeIndustry(cells[2] ?? ""),
      employee_range: normalizeRange(cells[3] ?? ""),
      runs_paid_ads: truthy.has((cells[4] ?? "").toLowerCase()),
      publishes_video: truthy.has((cells[5] ?? "").toLowerCase()),
      in_house_team: truthy.has((cells[6] ?? "").toLowerCase()),
    });
  }
  return { leads, errors };
}
