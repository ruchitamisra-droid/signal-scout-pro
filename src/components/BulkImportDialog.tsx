import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseCsv } from "@/lib/scoring";
import type { LeadInput } from "@/lib/scoring";

const TEMPLATE =
  "Company,Website,Industry,Employee Count,Runs Paid Ads,Publishes Video,In-House Team\nAcme Studios,acme.com,Agency,11-50,yes,yes,no";

export function BulkImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (leads: LeadInput[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = text.trim() ? parseCsv(text) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Bulk import leads</DialogTitle>
          <DialogDescription>
            Paste CSV or upload a file. Columns: Company, Website, Industry, Employee
            Count, Runs Paid Ads, Publishes Video, In-House Team. Parsed in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setText(await file.text());
                e.target.value = "";
              }}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              Upload CSV
            </Button>
            <Button type="button" variant="ghost" onClick={() => setText(TEMPLATE)}>
              Insert example
            </Button>
          </div>

          <Textarea
            rows={9}
            className="font-mono text-xs"
            placeholder={TEMPLATE}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {preview && (
            <p className="text-sm text-muted-foreground">
              {preview.leads.length} lead{preview.leads.length === 1 ? "" : "s"} ready to
              import.
            </p>
          )}
          {errors.length > 0 && (
            <ul className="space-y-1 text-xs text-destructive">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || !preview || preview.leads.length === 0}
            onClick={async () => {
              if (!preview) return;
              setErrors(preview.errors);
              if (preview.leads.length === 0) return;
              setBusy(true);
              try {
                await onImport(preview.leads);
                setText("");
                setErrors([]);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Importing…" : "Import leads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
