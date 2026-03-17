import { runStructuredGeneration } from "@/services/llm/run-structured-generation";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AuditReport } from "@/types/audit";
import type { AuditAgentTrace } from "@/types/domain/agent-run";

const localizationSchema = {
  type: "object",
  properties: {
    report: {
      type: "object",
      properties: {
        stance: { type: "string" },
        summary: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              summary: { type: "string" },
            },
            required: ["label", "summary"],
            additionalProperties: false,
          },
        },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              rationale: { type: "string" },
              action: { type: "string" },
            },
            required: ["id", "title", "rationale", "action"],
            additionalProperties: false,
          },
        },
        highlights: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["stance", "summary", "sections", "findings", "highlights"],
      additionalProperties: false,
    },
    agentTraces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          agent: { type: "string" },
          summary: { type: "string" },
        },
        required: ["agent", "summary"],
        additionalProperties: false,
      },
    },
  },
  required: ["report", "agentTraces"],
  additionalProperties: false,
} as const;

export async function localizeAuditOutput(
  report: AuditReport,
  agentTraces: AuditAgentTrace[],
  settings: ProviderRuntimeSettings,
) {
  const { parsed } = await runStructuredGeneration(
    {
      schemaName: "localized_audit_output",
      schema: localizationSchema,
      systemText: [
        "당신은 UX 리포트 한국어 후처리 에이전트입니다.",
        "입력으로 받은 리포트 구조는 유지하고, 설명 텍스트만 자연스러운 한국어로 다시 정리하세요.",
        "점수, 카테고리, label, id, agent 이름, evidence 구조는 바꾸지 마세요.",
        "evidence 원문은 번역하지 말고 그대로 유지해야 합니다.",
        "영어로 작성된 설명, 요약, 수정안을 모두 자연스러운 한국어로 바꾸세요.",
        "브랜드명, 제품명, 고유 버튼 문구는 필요할 때만 원문을 유지하고, 설명 문장은 반드시 한국어로 작성하세요.",
      ].join("\n"),
      userPayload: { report, agentTraces },
    },
    settings,
  );

  const localized = parsed as {
    report: {
      stance: string;
      summary: string;
      sections: Array<{ label: string; summary: string }>;
      findings: Array<{ id: string; title: string; rationale: string; action: string }>;
      highlights: string[];
    };
    agentTraces: Array<{ agent: string; summary: string }>;
  };

  const sectionSummaryMap = new Map(localized.report.sections.map((section) => [section.label, section.summary]));
  const findingMap = new Map(localized.report.findings.map((finding) => [finding.id, finding]));
  const traceMap = new Map(localized.agentTraces.map((trace) => [trace.agent, trace.summary]));

  return {
    report: {
      ...report,
      stance: localized.report.stance || report.stance,
      summary: localized.report.summary || report.summary,
      sections: report.sections.map((section) => ({
        ...section,
        summary: sectionSummaryMap.get(section.label) || section.summary,
      })),
      findings: report.findings.map((finding) => {
        const localizedFinding = findingMap.get(finding.id);
        return localizedFinding
          ? {
              ...finding,
              title: localizedFinding.title || finding.title,
              rationale: localizedFinding.rationale || finding.rationale,
              action: localizedFinding.action || finding.action,
            }
          : finding;
      }),
      highlights: localized.report.highlights?.length ? localized.report.highlights : report.highlights,
    },
    agentTraces: agentTraces.map((trace) => ({
      ...trace,
      summary: traceMap.get(trace.agent) || trace.summary,
    })),
  };
}
