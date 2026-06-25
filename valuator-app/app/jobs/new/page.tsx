"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewJobPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("valuation_jobs")
      .insert({
        created_by: userData.user?.id,
        property_address: formData.get("property_address"),
        property_type: formData.get("property_type"),
        building_size_sqm: formData.get("building_size_sqm") || null,
        land_size_sqm: formData.get("land_size_sqm") || null,
        year_built: formData.get("year_built") || null,
        condition_notes: formData.get("condition_notes") || null,
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
        <label htmlFor="property_address">Property address</label>
        <input id="property_address" name="property_address" required />

        <label htmlFor="property_type">Property type</label>
        <select id="property_type" name="property_type" required defaultValue="">
          <option value="" disabled>
            Select type
          </option>
          <option value="Residential">Residential</option>
          <option value="Commercial Office">Commercial Office</option>
          <option value="Retail">Retail</option>
          <option value="Industrial / Warehouse">Industrial / Warehouse</option>
          <option value="Agricultural">Agricultural</option>
          <option value="Vacant Land">Vacant Land</option>
        </select>

        <div className="row">
          <div>
            <label htmlFor="building_size_sqm">Building size (sqm)</label>
            <input
              id="building_size_sqm"
              name="building_size_sqm"
              type="number"
              step="0.1"
            />
          </div>
          <div>
            <label htmlFor="land_size_sqm">Land size (sqm)</label>
            <input id="land_size_sqm" name="land_size_sqm" type="number" step="0.1" />
          </div>
        </div>

        <label htmlFor="year_built">Year built</label>
        <input id="year_built" name="year_built" type="number" />

        <label htmlFor="condition_notes">Condition notes</label>
        <textarea
          id="condition_notes"
          name="condition_notes"
          style={{ minHeight: 120 }}
          placeholder="General condition, recent renovations, defects, etc."
        />

        {error && <p className="error">{error}</p>}
        <button className="gold" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
}
