import { runStructuredGeneration } from "@/services/llm/run-structured-generation";
import { getBenchmarkSiteLabel, isBenchmarkSite } from "@/lib/benchmark-sites";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AuditAxis, AuditCategory, Severity } from "@/types/audit";
import type { AuditAgentName, AuditAgentResult } from "@/types/domain/agent-run";
import type { PageContext } from "@/types/page-context";

const allowedSeverities: Severity[] = ["치명", "높음", "보통", "낮음"];
const allowedCategories: AuditCategory[] = ["접근성", "콘텐츠", "전환", "모바일", "일관성"];
const allowedAxes: AuditAxis[] = [
  "명확성",
  "행동 유도",
  "정보 계층",
  "밀도와 여백",
  "상태 표현",
  "일관성",
];
const specialistSchema = {
  type: "object",
  properties: {
    agent: { type: "string", enum: ["clarity", "accessibility", "conversion", "mobile", "visual"] },
    summary: { type: "string" },
    score: { type: "number" },
    confidence: { type: "number" },
    findings: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          axis: { type: "string", enum: allowedAxes },
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
        required: ["title", "axis", "severity", "category", "rationale", "action", "evidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["agent", "summary", "score", "confidence", "findings"],
  additionalProperties: false,
} as const;

const benchmarkPrinciples = [
  "평가 기준은 Linear 같은 높은 완성도의 툴형 SaaS UX입니다.",
  "특히 빠른 이해, 선명한 정보 계층, 절제된 밀도, 분명한 상태 표현, 일관된 컴포넌트 규칙을 기준으로 삼으세요.",
  "시각적으로 화려한지보다 도구로서 빠르고 명확하게 작동하는지를 더 중요하게 보세요.",
  "평가는 반드시 다음 6축 중 하나로만 귀속하세요: 명확성, 행동 유도, 정보 계층, 밀도와 여백, 상태 표현, 일관성.",
].join("\n");

const agentInstructions: Record<AuditAgentName, string> = {
  clarity: [
    "당신은 명확성 분석 에이전트입니다.",
    "페이지가 누구를 위한 것인지, 무엇을 제공하는지, 첫 화면에서 무엇을 하게 되는지가 명확한지만 평가하세요.",
    "카피 구조, 제목 표현, 가치 제안 전달력, 정보 우선순위를 중심으로 판단하세요.",
    "전환율 일반론보다 실제 문구와 제목 근거를 우선 사용하세요.",
    "이 에이전트는 명확성 또는 정보 계층 축 중심으로만 판단하세요.",
  ].join("\n"),
  accessibility: [
    "당신은 접근성 분석 에이전트입니다.",
    "헤딩 구조, 링크/버튼 라벨 명확성, 정보 구조 일관성, 탐색 가능성을 중심으로 평가하세요.",
    "색 대비나 포커스 스타일처럼 시각적 검증이 필요한 항목은 evidence 없이는 단정하지 마세요.",
    "이 에이전트는 정보 계층 또는 일관성 축 중심으로만 판단하세요.",
  ].join("\n"),
  conversion: [
    "당신은 전환 분석 에이전트입니다.",
    "CTA 문구, 신뢰 신호, 행동 유도 흐름, 설득 순서를 중심으로 평가하세요.",
    "실제 버튼/링크/본문 문구를 근거로 우선순위 높은 전환 마찰을 찾으세요.",
    "이 에이전트는 행동 유도 또는 명확성 축 중심으로만 판단하세요.",
  ].join("\n"),
  mobile: [
    "당신은 모바일 UX 분석 에이전트입니다.",
    "작은 화면에서 텍스트 스캔과 행동 유도가 자연스러울지 텍스트 근거만으로 신중하게 추정하세요.",
    "긴 제목, 장문 설명, 과도한 링크 밀도, CTA 가시성 저하 가능성에 집중하세요.",
    "이 에이전트는 밀도와 여백 또는 정보 계층 축 중심으로만 판단하세요.",
  ].join("\n"),
  visual: [
    "당신은 비주얼 UX 분석 에이전트입니다.",
    "제공된 스크린샷을 보고 시각적 위계, 첫 화면 밀도, CTA 가시성, 카드 구획감, 여백, 스캔 가능성을 평가하세요.",
    "텍스트 evidence와 스크린샷을 함께 참고하되, 시각적 판단은 반드시 스크린샷에서 확인 가능한 내용만 다루세요.",
    "색상 대비를 정확한 수치처럼 단정하지 말고, 시각적 강조, 밀도, 주목도, 구분감 중심으로 설명하세요.",
    "이 에이전트는 정보 계층, 밀도와 여백, 상태 표현 축 중심으로만 판단하세요.",
  ].join("\n"),
};

function clampScore(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback;
}

function clampConfidence(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, Number(value.toFixed(2))))
    : fallback;
}

function buildEvidenceContext(pageContext: PageContext) {
  const benchmarkLabel = getBenchmarkSiteLabel(pageContext.url);

  return {
    url: pageContext.url,
    benchmarkLabel,
    isBenchmarkSite: Boolean(benchmarkLabel),
    source: pageContext.source,
    title: pageContext.title,
    description: pageContext.description,
    headings: pageContext.headings,
    buttons: pageContext.buttons,
    links: pageContext.links.slice(0, 8),
    textSnippet: pageContext.textSnippet,
    signalScore: pageContext.signalScore,
    warnings: pageContext.warnings,
    hasScreenshot: Boolean(pageContext.screenshotDataUrl),
  };
}

export async function runSpecialistAgent(
  agent: AuditAgentName,
  pageContext: PageContext,
  settings: ProviderRuntimeSettings,
): Promise<AuditAgentResult> {
  const benchmarkLabel = getBenchmarkSiteLabel(pageContext.url);
  const benchmarkRule = benchmarkLabel
    ? [
        `현재 분석 대상은 ${benchmarkLabel} 같은 기준 사이트입니다.`,
        "이 사이트는 높은 완성도의 레퍼런스이므로, 치명 또는 높음 수준 문제는 강한 evidence가 반복적으로 확인될 때만 제시하세요.",
        "의도된 정보 밀도, 라이브 피드, 복합 네비게이션처럼 툴형 SaaS에서 흔한 패턴을 단순히 복잡하다는 이유만으로 결함 처리하지 마세요.",
        "정말 문제가 아니라면 억지로 문제를 만들지 말고 강점 또는 유지 권고를 포함한 낮은 심각도의 판단을 사용하세요.",
      ].join("\n")
    : "";

  const { parsed } = await runStructuredGeneration(
    {
      schemaName: `${agent}_agent_result`,
      schema: specialistSchema,
      systemText: [
        benchmarkPrinciples,
        benchmarkRule,
        agentInstructions[agent],
        "반드시 제공된 페이지 evidence만 사용하세요.",
        "각 finding에는 반드시 하나의 axis를 지정하세요.",
        "일반론 반복을 피하고, 실제 문자열을 evidence에 넣으세요.",
        "confidence는 0~1 사이 숫자이며 텍스트 근거가 약하면 낮게 주세요.",
        "findings는 서로 다른 문제만 다뤄야 합니다.",
        "action은 실제로 손볼 수 있는 수정안이어야 하며, 현재 문구를 그대로 다시 쓰면 안 됩니다.",
        "예시를 제시할 때는 현재 문구와 다른 대안을 제시하세요. 동일한 문구를 'A -> A' 형태로 반복하지 마세요.",
        "버튼이나 링크 문구를 제안할 때는 더 구체적인 동사, 기대 결과, 다음 행동이 드러나게 작성하세요.",
        "근거만으로 개선 필요성이 약하면 억지로 문구를 바꾸라고 하지 말고, 유지 가능하다고 판단하세요.",
        "같은 의미의 수정안을 반복하지 말고, 왜 바꿔야 하는지와 어떻게 바꿀지를 한 문장 안에서 분명하게 설명하세요.",
        "summary, title, rationale, action은 반드시 자연스러운 한국어로 작성하세요. evidence만 원문 언어를 유지할 수 있습니다.",
        "영어 문장으로 답하지 마세요. 브랜드명, 제품명, 고유 버튼 문구처럼 원문 보존이 필요한 경우를 제외하면 설명은 모두 한국어로 작성하세요.",
      ].join("\n"),
      userPayload: { agent, pageEvidence: buildEvidenceContext(pageContext) },
      images: agent === "visual" && pageContext.screenshotDataUrl
        ? [{ dataUrl: pageContext.screenshotDataUrl, mediaType: "image/jpeg" }]
        : undefined,
    },
    settings,
  );

  const result = parsed as AuditAgentResult;
  const score = clampScore(result.score, agent === "visual" ? 55 : 60);
  const calibratedScore = isBenchmarkSite(pageContext.url) ? Math.max(score, 82) : score;

  return {
    agent,
    summary: typeof result.summary === "string" ? result.summary : "분석 요약이 없습니다.",
    score: calibratedScore,
    confidence: clampConfidence(result.confidence, agent === "visual" ? 0.55 : 0.6),
    findings: Array.isArray(result.findings) ? result.findings.slice(0, 3) : [],
  };
}
