import { useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { useToast } from "./Toast";
import type { ImportSummary } from "../types";

export function ImportPanel({ onImported }: { onImported: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [autoClassify, setAutoClassify] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setSummary(null);
    try {
      const result = await api.import(file, autoClassify);
      setSummary(result);
      toast.success(`Imported ${result.successful}/${result.total} tickets`);
      onImported();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="import-panel">
      <div className="import-controls">
        <label className="checkbox">
          <input type="checkbox" checked={autoClassify} onChange={(e) => setAutoClassify(e.target.checked)} />
          Auto-classify on import
        </label>
        <label className="btn-primary file-btn">
          {busy ? "Importing…" : "Import CSV / JSON / XML"}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,.xml"
            onChange={handleFile}
            disabled={busy}
            hidden
          />
        </label>
      </div>

      {summary && (
        <div className="import-summary">
          <span className="pill pill-ok">✓ {summary.successful} successful</span>
          <span className="pill pill-total">{summary.total} total</span>
          {summary.failed > 0 && <span className="pill pill-fail">✗ {summary.failed} failed</span>}
          {summary.errors.length > 0 && (
            <ul className="import-errors">
              {summary.errors.map((err) => (
                <li key={err.row}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
