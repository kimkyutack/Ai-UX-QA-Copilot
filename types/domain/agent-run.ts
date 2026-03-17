import type { AuditCategory, AuditFinding, Severity } from "@/types/audit";

export type AuditAgentName = "clarity" | "accessibility" | "conversion" | "mobile" | "visual";

export type AuditAgentFinding = {
  title: string;
  severity: Severity;
  category: AuditCategory;
  rationale: string;
  action: string;
  evidence: string[];
};

export type AuditAgentResult = {
  agent: AuditAgentName;
  summary: string;
  score: number;
  confidence: number;
  findings: AuditAgentFinding[];
};

export type AuditAgentTrace = {
  agent: AuditAgentName;
  score: number;
  confidence: number;
  summary: string;
};

export type AuditOrchestrationHooks = {
  onStageChange?: (stage: {
    value:
      | "collecting"
      | "analyzing"
      | "synthesizing"
      | "localizing"
      | "persisting";
    label: string;
  }) => Promise<void> | void;
  onAgentStart?: (agent: AuditAgentName) => Promise<void> | void;
  onAgentComplete?: (trace: AuditAgentTrace) => Promise<void> | void;
};
