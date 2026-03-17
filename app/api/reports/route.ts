import { NextResponse } from "next/server";
import {
  listAuditReports,
  listAuditReportsByProjectId,
  listAuditReportsByTargetUrl,
} from "@/services/repositories/audit-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("targetUrl")?.trim();
  const projectId = searchParams.get("projectId")?.trim();
  const limit = Number(searchParams.get("limit") ?? "10");

  const safeLimit = Number.isFinite(limit) ? limit : 10;
  const reports = projectId
    ? await listAuditReportsByProjectId(projectId, safeLimit)
    : targetUrl
      ? await listAuditReportsByTargetUrl(targetUrl, safeLimit)
      : await listAuditReports();

  return NextResponse.json({ reports });
}
