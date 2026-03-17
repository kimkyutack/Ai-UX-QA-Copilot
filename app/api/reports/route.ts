import { NextResponse } from "next/server";
import { listAuditReports, listAuditReportsByTargetUrl } from "@/services/repositories/audit-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("targetUrl")?.trim();
  const limit = Number(searchParams.get("limit") ?? "10");

  const reports = targetUrl
    ? await listAuditReportsByTargetUrl(targetUrl, Number.isFinite(limit) ? limit : 10)
    : await listAuditReports();

  return NextResponse.json({ reports });
}
