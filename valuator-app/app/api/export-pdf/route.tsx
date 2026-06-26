import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import ValuationReportPdf from "@/lib/pdf/ValuationReportPdf";

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

  if (!job.draft_report) {
    return NextResponse.json(
      { error: "Generate a draft before exporting a PDF" },
      { status: 400 }
    );
  }

  const { data: comparables } = await supabase
    .from("comparable_sales")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  const { data: photos } = await supabase
    .from("job_photos")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  const photoUrls = (
    await Promise.all(
      (photos ?? []).map(async (p) => {
        const { data } = await supabase.storage
          .from("job-photos")
          .createSignedUrl(p.storage_path, 60 * 60);
        return data?.signedUrl ?? null;
      })
    )
  ).filter((url): url is string => Boolean(url));

  const pdfBuffer = await renderToBuffer(
    <ValuationReportPdf
      subjectTitle={job.subject_title}
      assetCategory={job.asset_category}
      details={job.details ?? {}}
      draftReport={job.draft_report}
      comparables={(comparables ?? []).map((c) => ({
        description: c.address,
        salePrice: c.sale_price,
        saleDate: c.sale_date,
        sizeOrMetric: c.size_sqm,
      }))}
      photos={photoUrls}
      generatedDate={new Date().toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    />
  );

  const fileName = `${job.subject_title.replace(/[^a-z0-9]+/gi, "-")}-draft.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
