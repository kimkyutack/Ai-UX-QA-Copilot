import type { AuditReport } from "@/types/audit";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type { AIProvider } from "@/types/domain/ai-settings";
import type { AnalysisMode } from "@/types/domain/analysis-mode";
import type { ReportCollaboration } from "@/types/domain/report-collaboration";

export type AuditReportRecord = {
  id: string;
  jobId: string;
  projectId: string;
  targetUrl: string;
  createdAt: string;
  report: AuditReport;
  collaboration?: ReportCollaboration;
  debug: {
    analysisMode?: AnalysisMode;
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
    screenshotDataUrl?: string;
    agentTraces?: AuditAgentTrace[];
  };
};
