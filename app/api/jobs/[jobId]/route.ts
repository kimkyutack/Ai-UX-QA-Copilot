import { NextResponse } from "next/server";
import { getAuditJob, getAuditReportByJobId } from "@/services/repositories/audit-store";

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = await getAuditJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }

  const report = await getAuditReportByJobId(jobId);
  return NextResponse.json({ job, report });
}
