import { NextResponse } from "next/server";
import { processAuditJob } from "@/services/analysis/run-audit-job";
import { getAuditJob, getAuditReportByJobId } from "@/services/repositories/audit-store";
import type { CreateJobRequest } from "@/types/api/jobs";

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await getAuditJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }

  const report = await getAuditReportByJobId(jobId);
  return NextResponse.json({ job, report });
}

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await getAuditJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }

  if (job.status === "running" || job.status === "completed") {
    const report = await getAuditReportByJobId(jobId);
    return NextResponse.json({ job, report });
  }

  const body = (await request.json()) as CreateJobRequest;
  const result = await processAuditJob(jobId, {
    url: job.targetUrl,
    projectId: job.projectId,
    providerSettings: {
      provider: body.provider,
      model: body.model,
      apiKey: body.apiKey,
    },
  });

  if (result.error) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
