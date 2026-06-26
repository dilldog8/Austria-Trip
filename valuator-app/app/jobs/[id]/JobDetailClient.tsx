"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AssetCategory,
  CATEGORY_LABELS,
  CATEGORY_FIELDS,
  SUBJECT_TITLE_LABELS,
  humanizeKey,
} from "@/lib/categories";

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
  const router = useRouter();

  const [comparables, setComparables] = useState(initialComparables);
  const [photos, setPhotos] = useState(initialPhotos);
  const [draft, setDraft] = useState(job.draft_report ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddComparable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const day = formData.get("sale_day");
    const month = formData.get("sale_month");
    const year = formData.get("sale_year");
    const sale_date =
      day && month && year
        ? `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        : null;

    const { data, error } = await supabase
      .from("comparable_sales")
      .insert({
        job_id: job.id,
        address: formData.get("address"),
        sale_price: Number(formData.get("sale_price")),
        sale_date,
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

  async function handleDeletePhoto(photo: Photo) {
    if (!window.confirm("Remove this photo? This cannot be undone.")) return;

    setError(null);
    await supabase.storage.from("job-photos").remove([photo.storage_path]);
    const { error } = await supabase.from("job_photos").delete().eq("id", photo.id);

    if (error) {
      setError(error.message);
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  async function handleSaveDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingDetails(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const details: Record<string, string | number | null> = {};
    for (const field of CATEGORY_FIELDS[job.asset_category]) {
      const value = formData.get(field.name);
      details[field.name] = value ? (value as string) : null;
    }

    const { error } = await supabase
      .from("valuation_jobs")
      .update({ subject_title: formData.get("subject_title"), details })
      .eq("id", job.id);

    setSavingDetails(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingDetails(false);
    router.refresh();
  }

  async function handleDeleteJob() {
    if (
      !window.confirm(
        `Delete "${job.subject_title}" permanently? This removes the job, its comparables, and its photos. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingJob(true);
    setError(null);

    if (photos.length > 0) {
      await supabase.storage
        .from("job-photos")
        .remove(photos.map((p) => p.storage_path));
    }

    const { error } = await supabase.from("valuation_jobs").delete().eq("id", job.id);

    if (error) {
      setDeletingJob(false);
      setError(error.message);
      return;
    }

    router.push("/dashboard");
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
        <div className="topbar" style={{ marginBottom: editingDetails ? "0.5rem" : 0 }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Details</h2>
          <button
            className="secondary"
            style={{ marginTop: 0 }}
            onClick={() => setEditingDetails((v) => !v)}
          >
            {editingDetails ? "Cancel" : "Edit"}
          </button>
        </div>

        {editingDetails ? (
          <form onSubmit={handleSaveDetails}>
            <label htmlFor="subject_title">{SUBJECT_TITLE_LABELS[job.asset_category]}</label>
            <input
              id="subject_title"
              name="subject_title"
              defaultValue={job.subject_title}
              required
            />
            {CATEGORY_FIELDS[job.asset_category].map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    style={{ minHeight: 100 }}
                    defaultValue={job.details[field.name] ?? ""}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    defaultValue={job.details[field.name] ?? ""}
                    required={field.required}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    step={field.type === "number" ? "0.1" : undefined}
                    defaultValue={job.details[field.name] ?? ""}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <button className="gold" type="submit" disabled={savingDetails}>
              {savingDetails ? "Saving..." : "Save Details"}
            </button>
          </form>
        ) : (
          <>
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
          </>
        )}
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
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <input
              name="sale_day"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              placeholder="DD"
            />
            <input
              name="sale_month"
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              placeholder="MM"
            />
            <input
              name="sale_year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              placeholder="YYYY"
            />
          </div>
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
              <div key={p.id} style={{ position: "relative" }}>
                <img
                  src={p.url}
                  alt=""
                  style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6, display: "block" }}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleDeletePhoto(p)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    marginTop: 0,
                    padding: "0.15rem 0.5rem",
                    fontSize: "0.7rem",
                    background: "rgba(255,255,255,0.92)",
                  }}
                >
                  Remove
                </button>
              </div>
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

      <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
        <button className="danger" onClick={handleDeleteJob} disabled={deletingJob}>
          {deletingJob ? "Deleting..." : "Delete Job"}
        </button>
      </div>
    </>
  );
}
