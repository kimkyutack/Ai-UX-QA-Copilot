import { generateHeuristicAuditReport } from "@/lib/heuristic-audit";
import { runStructuredGeneration } from "@/services/llm/run-structured-generation";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AuditCategory, AuditFinding, AuditReport, AuditSection, Severity } from "@/types/audit";
import type { AuditAgentResult } from "@/types/domain/agent-run";
import type { PageContext } from "@/types/page-context";

const allowedSeverities: Severity[] = ["치명", "높음", "보통", "낮음"];
const allowedCategories: AuditCategory[] = ["접근성", "콘텐츠", "전환", "모바일", "일관성"];
const finalReportSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    stance: { type: "string" },
    summary: { type: "string" },
    sections: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          score: { type: "number" },
          summary: { type: "string" },
        },
        required: ["label", "score", "summary"],
        additionalProperties: false,
      },
    },
    findings: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          severity: { type: "string", enum: allowedSeverities },
          category: { type: "string", enum: allowedCategories },
          rationale: { type: "string" },
          action: { type: "string" },
          evidence: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string" },
          },
        },
        required: ["id", "title", "severity", "category", "rationale", "action", "evidence"],
        additionalProperties: false,
      },
    },
    highlights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
  },
  required: ["score", "stance", "summary", "sections", "findings", "highlights"],
  additionalProperties: false,
} as const;

function safeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSeverity(value: unknown, fallback: Severity): Severity {
  return typeof value === "string" && allowedSeverities.includes(value as Severity)
    ? (value as Severity)
    : fallback;
}

function normalizeCategory(value: unknown, fallback: AuditCategory): AuditCategory {
  return typeof value === "string" && allowedCategories.includes(value as AuditCategory)
    ? (value as AuditCategory)
    : fallback;
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => safeString(item, "")).filter(Boolean).slice(0, 3)
    : undefined;
}

function normalizeSections(value: unknown, fallback: AuditSection[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.slice(0, 4).map((item, index) => {
    const current = item as Partial<AuditSection>;
    const base = fallback[index] ?? fallback[fallback.length - 1];

    return {
      label: safeString(current.label, base.label),
      score:
        typeof current.score === "number" && Number.isFinite(current.score)
          ? Math.max(0, Math.min(100, Math.round(current.score)))
          : base.score,
      summary: safeString(current.summary, base.summary),
    };
  });
}

function normalizeFindings(value: unknown, fallback: AuditFinding[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.slice(0, 8).map((item, index) => {
    const current = item as Partial<AuditFinding> & { evidence?: unknown };
    const base = fallback[index] ?? fallback[fallback.length - 1];

    return {
      id: safeString(current.id, `${base.id}-${index}`),
      title: safeString(current.title, base.title),
      severity: normalizeSeverity(current.severity, base.severity),
      category: normalizeCategory(current.category, base.category),
      rationale: safeString(current.rationale, base.rationale),
      action: safeString(current.action, base.action),
      evidence: normalizeStringList(current.evidence),
    };
  });
}

function normalizeReport(raw: unknown, target: string, fallback: AuditReport): AuditReport {
  const current = (raw ?? {}) as Partial<AuditReport>;

  return {
    target,
    score:
      typeof current.score === "number" && Number.isFinite(current.score)
        ? Math.max(0, Math.min(100, Math.round(current.score)))
        : fallback.score,
    stance: safeString(current.stance, fallback.stance),
    summary: safeString(current.summary, fallback.summary),
    sections: normalizeSections(current.sections, fallback.sections),
    findings: normalizeFindings(current.findings, fallback.findings),
    highlights: Array.isArray(current.highlights)
      ? current.highlights.map((item) => safeString(item, "")).filter(Boolean).slice(0, 4)
      : fallback.highlights,
  };
}

function buildEvidenceContext(pageContext: PageContext) {
  return {
    url: pageContext.url,
    source: pageContext.source,
    title: pageContext.title,
    description: pageContext.description,
    headings: pageContext.headings,
    buttons: pageContext.buttons,
    links: pageContext.links.slice(0, 8),
    textSnippet: pageContext.textSnippet,
    signalScore: pageContext.signalScore,
    warnings: pageContext.warnings,
  };
}

export async function synthesizeAuditReport(
  target: string,
  pageContext: PageContext,
  agentResults: AuditAgentResult[],
  settings: ProviderRuntimeSettings,
) {
  const heuristicReport = generateHeuristicAuditReport(target);

  const { parsed } = await runStructuredGeneration(
    {
      schemaName: "orchestrated_ux_audit_report",
      schema: finalReportSchema,
      systemText: [
        "당신은 최종 UX 리포트 정리 에이전트입니다.",
        "여러 전문 에이전트의 결과를 종합해 최종 UX 감사 리포트를 작성하세요.",
        "전문 에이전트 사이 중복되는 finding은 병합하고, evidence가 없는 주장은 제거하세요.",
        "agent 결과를 그대로 복붙하지 말고, 우선순위와 최종 점수를 일관되게 정리하세요.",
        "warnings가 있으면 summary 또는 findings에서 한계를 반영하세요.",
        "최종 findings는 서로 다른 문제를 다뤄야 하며 evidence를 유지해야 합니다.",
        "action은 바로 실행 가능한 수정안이어야 하며, 현재 문구를 그대로 반복하거나 'A -> A'처럼 같은 예시를 제시하면 안 됩니다.",
        "문구 수정안을 줄 때는 현재 evidence와 다른 구체적인 대안을 제시하고, 왜 그 대안이 더 명확한지도 함께 설명하세요.",
        "버튼/링크 문구가 이미 충분히 짧고 명확하면 불필요하게 바꾸지 말고, 대신 위치, 우선순위, 주변 맥락을 개선하라고 제안하세요.",
        "막연한 표현 대신 제품 문맥에 맞는 동사, 결과, 다음 행동이 드러나는 수정안을 쓰세요.",
      ].join("\n"),
      userPayload: {
        target,
        pageEvidence: buildEvidenceContext(pageContext),
        heuristicHints: {
          suggestedSections: heuristicReport.sections.map((section) => section.label),
          suggestedCategories: [...new Set(heuristicReport.findings.map((finding) => finding.category))],
        },
        agentResults,
      },
    },
    settings,
  );

  return normalizeReport(parsed, heuristicReport.target, heuristicReport);
}
