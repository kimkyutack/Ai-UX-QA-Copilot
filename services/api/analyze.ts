import type { AuditReport } from "@/types/audit";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type { AIProvider } from "@/types/domain/ai-settings";

export type AnalyzeResponse = {
  report?: AuditReport;
  error?: string;
  debug?: {
    signalScore: number;
    warnings: string[];
    source: "fetch" | "playwright";
    provider?: AIProvider;
    model?: string;
    title?: string;
    description?: string;
    headings?: string[];
    buttons?: string[];
    links?: string[];
    textSnippet?: string;
    agentTraces?: AuditAgentTrace[];
  };
};

export async function requestAuditReport(url: string, options: { provider: AIProvider; model: string; apiKey: string }) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      provider: options.provider,
      model: options.model,
      apiKey: options.apiKey,
    }),
  });

  const data = (await response.json()) as AnalyzeResponse;

  if (!response.ok || !data.report) {
    throw new Error(data.error ?? "리포트를 생성할 수 없습니다.");
  }

  return data;
}
