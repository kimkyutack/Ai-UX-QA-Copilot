import type { AuditAgentName } from "@/types/domain/agent-run";
import type { AnalysisMode } from "@/types/domain/analysis-mode";

export type AuditJobStatus = "queued" | "running" | "completed" | "failed";
export type AuditJobStage =
  | "queued"
  | "collecting"
  | "analyzing"
  | "synthesizing"
  | "localizing"
  | "persisting"
  | "completed"
  | "failed";

export type AuditJobAgentState = {
  agent: AuditAgentName;
  status: "queued" | "running" | "completed" | "failed";
  score?: number;
  confidence?: number;
  summary?: string;
};

export type AuditJobPreview = {
  stance: string;
  summary: string;
  highlights: string[];
  sections: Array<{
    label: string;
    summary: string;
    score?: number;
  }>;
};

export type AuditJob = {
  id: string;
  projectId: string;
  targetUrl: string;
  analysisMode: AnalysisMode;
  status: AuditJobStatus;
  stage: AuditJobStage;
  stageLabel?: string;
  createdAt: string;
  updatedAt: string;
  reportId?: string;
  errorMessage?: string;
  signalScore?: number;
  source?: "fetch" | "playwright";
  agentStates?: AuditJobAgentState[];
  preview?: AuditJobPreview;
};
