import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JobDetailClient from "./JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: job } = await supabase
    .from("valuation_jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!job) {
    notFound();
  }

  const { data: comparables } = await supabase
    .from("comparable_sales")
    .select("*")
    .eq("job_id", params.id)
    .order("created_at", { ascending: true });

  const { data: photos } = await supabase
    .from("job_photos")
    .select("*")
    .eq("job_id", params.id)
    .order("created_at", { ascending: true });

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(p.storage_path, 60 * 60);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="container">
      <div className="topbar">
        <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{job.property_address}</h1>
        <Link href="/dashboard">Back to jobs</Link>
      </div>

      <JobDetailClient
        job={job}
        initialComparables={comparables ?? []}
        initialPhotos={photosWithUrls}
      />
    </div>
  );
}
