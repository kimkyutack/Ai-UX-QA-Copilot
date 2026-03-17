import type { AuditReport } from "@/types/audit";
import type { AuditAgentResult } from "@/types/domain/agent-run";

function hasDuplicateReplacementPattern(action: string) {
  const normalized = action.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  const pairPattern = /['"]([^'"]+)['"]\s*(?:->|→)\s*['"]([^'"]+)['"]/g;
  const matches = [...normalized.matchAll(pairPattern)];

  return matches.some((match) => match[1].trim().toLowerCase() === match[2].trim().toLowerCase());
}

function sanitizeAction(action: string) {
  if (!hasDuplicateReplacementPattern(action)) {
    return action;
  }

  return "현재 문구를 그대로 반복해 바꾸기보다, 사용자가 다음에 무엇을 하게 되는지 드러나는 더 구체적인 행동형 문구로 다시 검토하세요.";
}

export function verifyAuditReport(report: AuditReport, agentResults: AuditAgentResult[]): AuditReport {
  const seenTitles = new Set<string>();
  const allowedEvidence = new Set(
    agentResults.flatMap((agent) => agent.findings.flatMap((finding) => finding.evidence.map((item) => item.trim()))),
  );

  const findings = report.findings
    .filter((finding) => {
      const normalized = finding.title.trim().toLowerCase();
      if (seenTitles.has(normalized)) {
        return false;
      }
      seenTitles.add(normalized);
      return true;
    })
    .map((finding) => ({
      ...finding,
      axis: finding.axis ?? "명확성",
      action: sanitizeAction(finding.action),
      evidence: (finding.evidence ?? []).filter((item) => allowedEvidence.has(item.trim())).slice(0, 3),
    }))
    .filter((finding) => (finding.evidence?.length ?? 0) > 0)
    .slice(0, 6);

  return {
    ...report,
    findings,
    highlights: report.highlights.slice(0, 3),
  };
}
