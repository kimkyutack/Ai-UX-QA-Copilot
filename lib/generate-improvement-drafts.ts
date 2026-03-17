import { analysisModeOptions, type AnalysisMode } from "@/types/domain/analysis-mode";
import type { AuditFinding, AuditReport } from "@/types/audit";

export type ImprovementDraft = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  items: string[];
  note: string;
};

function getModeLabel(mode: AnalysisMode) {
  return analysisModeOptions.find((option) => option.value === mode)?.label ?? "기본";
}

function getDomainLabel(target: string) {
  return target.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

function pickFindingByAxis(findings: AuditFinding[], axis: AuditFinding["axis"]) {
  return findings.find((finding) => finding.axis === axis);
}

function buildHeroDraft(mode: AnalysisMode, report: AuditReport) {
  const clarityFinding = pickFindingByAxis(report.findings, "명확성");
  const label = getDomainLabel(report.target);

  const templates: Record<AnalysisMode, string[]> = {
    saas: [
      "헤드라인: 팀이 어떤 업무를 더 빠르게 끝내는지 한 문장으로 말합니다.",
      "서브카피: 자동화되는 작업, 기대 결과, 신뢰 근거를 한 문단 안에 넣습니다.",
      `예시 구조: "${label}가 누구를 위한 제품인지" + "무엇이 더 빨라지는지" + "왜 지금 믿을 수 있는지"`,
    ],
    ecommerce: [
      "헤드라인: 대표 상품 또는 핵심 혜택을 첫 문장에 바로 드러냅니다.",
      "서브카피: 가격/혜택/배송 또는 신뢰 요소를 2~3개로 압축합니다.",
      `예시 구조: "무엇을 파는지" + "왜 좋은지" + "지금 사야 하는 이유"`,
    ],
    portfolio: [
      "헤드라인: 어떤 분야의 어떤 결과를 만드는 사람인지 한 문장으로 소개합니다.",
      "서브카피: 대표 프로젝트 성격, 협업 방식, 성과를 짧게 연결합니다.",
      `예시 구조: "나는 누구인가" + "무엇을 잘하는가" + "어떤 작업을 보여줄 것인가"`,
    ],
    recruiting: [
      "헤드라인: 어떤 포지션을 누구에게 제안하는지 먼저 분명히 적습니다.",
      "서브카피: 기대 역할, 팀 맥락, 지원 유인을 짧게 연결합니다.",
      `예시 구조: "모집 포지션" + "함께 풀 문제" + "지원해야 하는 이유"`,
    ],
    docs: [
      "헤드라인: 이 문서로 무엇을 배우거나 해결할 수 있는지 먼저 선언합니다.",
      "서브카피: 예상 소요 시간, 필요한 선행 지식, 다음 결과를 붙입니다.",
      `예시 구조: "무엇을 할 수 있게 되는지" + "얼마나 걸리는지" + "어디서 시작할지"`,
    ],
  };

  return {
    id: "hero",
    eyebrow: "히어로 초안",
    title: `${getModeLabel(mode)} 기준 첫 화면 문구 구조`,
    summary:
      clarityFinding?.action ??
      "첫 화면에서는 대상 사용자와 기대 결과가 즉시 읽혀야 합니다.",
    items: templates[mode],
    note: "지금 페이지의 첫 문장을 다시 쓰기 전에, 대상-핵심 가치-기대 결과 순서가 먼저 보이도록 정리하는 데 집중하세요.",
  } satisfies ImprovementDraft;
}

function buildCtaDraft(mode: AnalysisMode, report: AuditReport) {
  const actionFinding = pickFindingByAxis(report.findings, "행동 유도");

  const options: Record<AnalysisMode, string[]> = {
    saas: ["무료로 시작하기", "데모 바로 보기", "워크스페이스 만들기"],
    ecommerce: ["지금 구매하기", "옵션 선택 후 담기", "혜택 확인하고 주문하기"],
    portfolio: ["대표 작업 보기", "프로젝트 문의하기", "이력서 다운로드"],
    recruiting: ["지원 시작하기", "포지션 상세 보기", "채용팀과 이야기하기"],
    docs: ["빠르게 시작하기", "설치부터 따라하기", "예제로 바로 보기"],
  };

  return {
    id: "cta",
    eyebrow: "CTA 초안",
    title: "행동 결과가 보이는 버튼 문구 제안",
    summary:
      actionFinding?.action ??
      "버튼은 클릭 후 어떤 결과가 생기는지가 바로 읽혀야 합니다.",
    items: options[mode],
    note: "현재 페이지의 메인 CTA는 한 종류만 강하게 강조하고, 나머지는 보조 액션으로 한 단계 낮추는 편이 좋습니다.",
  } satisfies ImprovementDraft;
}

function buildStructureDraft(mode: AnalysisMode, report: AuditReport) {
  const hierarchyFinding = pickFindingByAxis(report.findings, "정보 계층");

  const sections: Record<AnalysisMode, string[]> = {
    saas: ["1. 히어로", "2. 핵심 효익 3개", "3. 제품 데모 또는 사용 흐름", "4. 신뢰 요소", "5. CTA 반복"],
    ecommerce: ["1. 대표 상품/혜택", "2. 주요 옵션 또는 베스트셀러", "3. 가격/프로모션", "4. 리뷰/신뢰", "5. 구매 CTA"],
    portfolio: ["1. 소개", "2. 대표 프로젝트", "3. 작업 방식", "4. 성과/신뢰", "5. 문의 CTA"],
    recruiting: ["1. 포지션 소개", "2. 역할과 기대 결과", "3. 팀/문화", "4. 보상/혜택", "5. 지원 CTA"],
    docs: ["1. 빠른 시작", "2. 개념 소개", "3. 예제", "4. 자주 찾는 가이드", "5. 다음 단계"],
  };

  return {
    id: "structure",
    eyebrow: "구조 초안",
    title: "추천 섹션 순서",
    summary:
      hierarchyFinding?.action ??
      "정보는 사용자가 먼저 궁금해할 순서대로 배치될 때 가장 빨리 읽힙니다.",
    items: sections[mode],
    note: "지금 페이지에서 먼저 손볼 부분은 섹션을 추가하는 것보다, 이미 있는 블록의 순서를 바꿔 우선순위를 분명하게 만드는 일입니다.",
  } satisfies ImprovementDraft;
}

export function generateImprovementDrafts(mode: AnalysisMode, report: AuditReport) {
  return [
    buildHeroDraft(mode, report),
    buildCtaDraft(mode, report),
    buildStructureDraft(mode, report),
  ];
}
