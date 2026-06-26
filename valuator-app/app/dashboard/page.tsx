import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, CATEGORY_COLORS, AssetCategory } from "@/lib/categories";
import Brand from "@/app/components/Brand";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: myProfile } = userData.user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()
    : { data: null };

  const { data: jobs } = await supabase
    .from("valuation_jobs")
    .select("id, subject_title, asset_category, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="container">
      <div className="topbar">
        <div>
          <Brand />
          <h1 style={{ margin: "0.5rem 0 0", fontSize: "1.3rem" }}>Valuation Jobs</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {myProfile?.role === "admin" && (
            <Link href="/admin/users">
              <button className="secondary" style={{ marginTop: 0 }}>
                Manage Users
              </button>
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      <Link href="/jobs/new">
        <button className="gold" style={{ marginTop: 0 }}>
          + New Valuation Job
        </button>
      </Link>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        {!jobs || jobs.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No jobs yet. Create your first valuation job to get started.
          </p>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="job-list-item"
            >
              <div>
                <div style={{ fontWeight: 500 }}>{job.subject_title}</div>
                <div className="job-meta">
                  <span
                    className="category-dot"
                    style={{
                      background: CATEGORY_COLORS[job.asset_category as AssetCategory],
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    {CATEGORY_LABELS[job.asset_category as AssetCategory]}
                  </span>
                </div>
              </div>
              <span className={`pill ${job.status === "drafted" ? "pill-gold" : ""}`}>
                {job.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
