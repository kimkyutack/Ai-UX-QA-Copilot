import type { AuditCategory, AuditFinding, Severity } from "@/types/audit";

export type AuditAgentName = "clarity" | "accessibility" | "conversion" | "mobile";

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
