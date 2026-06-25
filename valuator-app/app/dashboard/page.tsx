import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: jobs } = await supabase
    .from("valuation_jobs")
    .select("id, property_address, property_type, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Valuation Jobs</h1>
        <SignOutButton />
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
                <div>{job.property_address}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {job.property_type}
                </div>
              </div>
              <span className="pill">{job.status}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
