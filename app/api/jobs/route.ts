import { NextResponse } from "next/server";
import { createQueuedAuditJob } from "@/services/analysis/run-audit-job";
import { listAuditJobs } from "@/services/repositories/audit-store";
import type { CreateJobRequest } from "@/types/api/jobs";

export async function GET() {
  const jobs = await listAuditJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateJobRequest;
  const url = body.url?.trim();

  if (!url) {
    return NextResponse.json({ error: "URL을 입력해 주세요." }, { status: 400 });
  }

  const normalized = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  try {
    new URL(normalized);
  } catch {
    return NextResponse.json({ error: "올바른 URL 형식을 입력해 주세요." }, { status: 400 });
  }

  const job = await createQueuedAuditJob({
    url: normalized,
    projectId: body.projectId,
  });

  return NextResponse.json({ job }, { status: 202 });
}
