"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ASSET_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_FIELDS,
  SUBJECT_TITLE_LABELS,
  AssetCategory,
} from "@/lib/categories";

export default function NewJobPage() {
  const router = useRouter();
  const supabase = createClient();
  const [category, setCategory] = useState<AssetCategory>("property");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const { data: userData } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userData.user?.id)
      .single();

    const details: Record<string, string | number | null> = {};
    for (const field of CATEGORY_FIELDS[category]) {
      const value = formData.get(field.name);
      details[field.name] = value ? (value as string) : null;
    }

    const { data, error } = await supabase
      .from("valuation_jobs")
      .insert({
        created_by: userData.user?.id,
        org_id: profile?.org_id,
        asset_category: category,
        subject_title: formData.get("subject_title"),
        details,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/jobs/${data.id}`);
  }

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>New Valuation Job</h1>
        <Link href="/dashboard">Back</Link>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="asset_category">Asset category</label>
        <select
          id="asset_category"
          value={category}
          onChange={(e) => setCategory(e.target.value as AssetCategory)}
        >
          {ASSET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        <label htmlFor="subject_title">{SUBJECT_TITLE_LABELS[category]}</label>
        <input id="subject_title" name="subject_title" required />

        {CATEGORY_FIELDS[category].map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                style={{ minHeight: 100 }}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select id={field.name} name={field.name} required={field.required} defaultValue="">
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
                required={field.required}
              />
            )}
          </div>
        ))}

        {error && <p className="error">{error}</p>}
        <button className="gold" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
}
