import { NextResponse } from "next/server";
import { runAuditJob } from "@/services/analysis/run-audit-job";
import type { AIProvider } from "@/types/domain/ai-settings";
import type { AnalysisMode } from "@/types/domain/analysis-mode";

type AnalyzeRequest = {
  url?: string;
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
  analysisMode?: AnalysisMode;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequest;
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

  const result = await runAuditJob({
    url: normalized,
    analysisMode: body.analysisMode ?? "saas",
    providerSettings: {
      provider: body.provider,
      model: body.model,
      apiKey: body.apiKey,
    },
  });

  if (result.error) {
    return NextResponse.json({ error: result.error, debug: result.debug, job: result.job }, { status: 422 });
  }

  return NextResponse.json({
    report: result.report?.report,
    debug: result.report?.debug,
    job: result.job,
    reportRecordId: result.report?.id,
  });
}
