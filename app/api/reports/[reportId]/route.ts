import { NextResponse } from "next/server";
import { getAuditReport, updateAuditReportFinding } from "@/services/repositories/audit-store";
import type { UpdateReportFindingPayload } from "@/types/api/reports";

export async function GET(_: Request, context: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await context.params;
  const report = await getAuditReport(reportId);

  if (!report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ report });
}

export async function PATCH(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await context.params;
  const body = (await request.json()) as Partial<UpdateReportFindingPayload>;

  if (!body.findingId || !body.status) {
    return NextResponse.json({ error: "findingId와 status는 필수입니다." }, { status: 400 });
  }

  const report = await updateAuditReportFinding(reportId, {
    findingId: body.findingId,
    status: body.status,
    assignee: body.assignee,
    note: body.note,
  });

  if (!report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ report });
}
