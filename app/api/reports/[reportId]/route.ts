import { NextResponse } from "next/server";
import { getAuditReport } from "@/services/repositories/audit-store";

export async function GET(_: Request, context: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await context.params;
  const report = await getAuditReport(reportId);

  if (!report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ report });
}
