import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateValuationDraft } from "@/lib/ai/generateReport";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { jobId } = await request.json();
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from("valuation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: comparables } = await supabase
    .from("comparable_sales")
    .select("*")
    .eq("job_id", jobId);

  let draft: string;
  try {
    draft = await generateValuationDraft({
      assetCategory: job.asset_category,
      subjectTitle: job.subject_title,
      details: job.details ?? {},
      comparables: (comparables ?? []).map((c) => ({
        description: c.address,
        salePrice: c.sale_price,
        saleDate: c.sale_date,
        sizeOrMetric: c.size_sqm,
        notes: c.notes,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("valuation_jobs")
    .update({ draft_report: draft, status: "drafted" })
    .eq("id", jobId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ draft });
}
