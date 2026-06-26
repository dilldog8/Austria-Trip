"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AssetCategory, CATEGORY_LABELS, humanizeKey } from "@/lib/categories";

interface Job {
  id: string;
  subject_title: string;
  asset_category: AssetCategory;
  details: Record<string, string | number | null>;
  status: string;
  draft_report: string | null;
}

interface Comparable {
  id: string;
  address: string;
  sale_price: number;
  sale_date: string | null;
  size_sqm: number | null;
  notes: string | null;
}

interface Photo {
  id: string;
  storage_path: string;
  url: string | null;
}

export default function JobDetailClient({
  job,
  initialComparables,
  initialPhotos,
}: {
  job: Job;
  initialComparables: Comparable[];
  initialPhotos: Photo[];
}) {
  const supabase = createClient();

  const [comparables, setComparables] = useState(initialComparables);
  const [photos, setPhotos] = useState(initialPhotos);
  const [draft, setDraft] = useState(job.draft_report ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddComparable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const { data, error } = await supabase
      .from("comparable_sales")
      .insert({
        job_id: job.id,
        address: formData.get("address"),
        sale_price: Number(formData.get("sale_price")),
        sale_date: formData.get("sale_date") || null,
        size_sqm: formData.get("size_sqm") || null,
        notes: formData.get("notes") || null,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setComparables((prev) => [...prev, data]);
    form.reset();
  }

  async function handleRemoveComparable(id: string) {
    await supabase.from("comparable_sales").delete().eq("id", id);
    setComparables((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const path = `${job.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: photoRow, error: insertError } = await supabase
      .from("job_photos")
      .insert({ job_id: job.id, storage_path: path })
      .select()
      .single();

    setUploading(false);

    if (insertError || !photoRow) {
      setError(insertError?.message ?? "Failed to save photo record");
      return;
    }

    const { data: signed } = await supabase.storage
      .from("job-photos")
      .createSignedUrl(path, 60 * 60);

    setPhotos((prev) => [
      ...prev,
      { id: photoRow.id, storage_path: path, url: signed?.signedUrl ?? null },
    ]);
    e.target.value = "";
  }

  async function handleGenerate() {
    if (
      draft &&
      !window.confirm(
        "This will replace the current draft text with a newly generated one. Any unsaved edits will be lost. Continue?"
      )
    ) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Generation failed");
        return;
      }

      setDraft(body.draft);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("valuation_jobs")
      .update({ draft_report: draft })
      .eq("id", job.id);

    setSaving(false);
    if (error) setError(error.message);
  }

  function handleExport() {
    const blob = new Blob([draft], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.subject_title.replace(/[^a-z0-9]+/gi, "-")}-draft.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    setError(null);

    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "PDF export failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${job.subject_title.replace(/[^a-z0-9]+/gi, "-")}-draft.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <>
      <div className="card">
        <h2 style={{ fontSize: "1.1rem" }}>Details</h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          {CATEGORY_LABELS[job.asset_category]}
        </p>
        {Object.entries(job.details)
          .filter(([, v]) => v !== null && v !== "")
          .map(([key, value]) => (
            <p key={key} style={{ marginTop: "0.5rem" }}>
              <strong>{humanizeKey(key)}:</strong> {value}
            </p>
          ))}
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Comparable Sales</h2>

        {comparables.map((c) => (
          <div key={c.id} className="comparable-row">
            <div>{c.address}</div>
            <div>R{c.sale_price.toLocaleString()}</div>
            <div>{c.sale_date ?? "—"}</div>
            <div>{c.size_sqm ? `${c.size_sqm}` : "—"}</div>
            <button
              className="secondary"
              style={{ marginTop: 0 }}
              onClick={() => handleRemoveComparable(c.id)}
            >
              Remove
            </button>
          </div>
        ))}

        <form onSubmit={handleAddComparable} className="comparable-row">
          <input name="address" placeholder="Description" required />
          <input
            name="sale_price"
            type="number"
            step="0.01"
            placeholder="Sale price"
            required
          />
          <input name="sale_date" type="date" />
          <input name="size_sqm" type="number" step="0.1" placeholder="Size / metric" />
          <button type="submit" style={{ marginTop: 0 }}>
            Add
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Photos</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {photos.map((p) =>
            p.url ? (
              <img
                key={p.id}
                src={p.url}
                alt=""
                style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6 }}
              />
            ) : null
          )}
        </div>
        <label htmlFor="photo-upload">Upload a photo</label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleUploadPhoto}
          disabled={uploading}
        />
        {uploading && <p style={{ color: "var(--muted)" }}>Uploading...</p>}
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="topbar" style={{ marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Draft Report</h2>
          <button className="gold" style={{ marginTop: 0 }} onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : draft ? "Regenerate Draft" : "Generate Draft"}
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Click 'Generate Draft' to create an AI-assisted first draft from the property details and comparables above."
        />

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="secondary" onClick={handleSaveDraft} disabled={saving || !draft}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="secondary" onClick={handleExport} disabled={!draft}>
            Export as .txt
          </button>
          <button className="secondary" onClick={handleExportPdf} disabled={!draft || exportingPdf}>
            {exportingPdf ? "Exporting..." : "Export as PDF"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}
