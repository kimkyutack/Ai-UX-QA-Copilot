import type { AuditFinding, AuditReport, AuditSection, Severity } from "@/types/audit";

const severityPenalty: Record<Severity, number> = {
  치명: 18,
  높음: 12,
  보통: 7,
  낮음: 3,
};

function scoreFromFindings(findings: AuditFinding[]) {
  return Math.max(
    42,
    96 - findings.reduce((total, finding) => total + severityPenalty[finding.severity], 0),
  );
}

function getDomainLabel(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.replace("www.", "");
  } catch {
    return rawUrl.trim();
  }
}

function inferContext(target: string) {
  const value = target.toLowerCase();

  return {
    hasCommerce: /(shop|store|cart|buy|product|sale)/.test(value),
    hasMarketing: /(landing|agency|studio|saas|app|ai|product)/.test(value),
    hasMobileRisk: /(app|m\.|mobile)/.test(value),
    hasDocs: /(docs|help|guide|learn)/.test(value),
  };
}

export function generateHeuristicAuditReport(target: string): AuditReport {
  const label = getDomainLabel(target);
  const context = inferContext(target);
  const findings: AuditFinding[] = [
    {
      id: "hero-clarity",
      title: "히어로 메시지가 사용자의 과업을 충분히 선명하게 설명하지 못합니다",
      axis: "명확성",
      severity: context.hasMarketing ? "보통" : "높음",
      category: "전환",
      rationale:
        "첫 화면의 메시지는 이 제품이 무엇인지보다, 사용 후 무엇이 달라지는지를 먼저 알려줘야 합니다.",
      action:
        "대상 사용자, 기대 결과, 신뢰 근거를 한 문장 안에서 빠르게 읽히도록 다시 구성하세요.",
    },
    {
      id: "cta-hierarchy",
      title: "주요 CTA의 시각적 우선순위가 약합니다",
      axis: "행동 유도",
      severity: "보통",
      category: "전환",
      rationale:
        "가장 중요한 행동이 보조 행동과 비슷하게 보이면 사용자는 망설이고 이탈할 가능성이 높아집니다.",
      action:
        "메인 CTA의 대비를 높이고, 보조 액션은 텍스트 링크나 고스트 버튼으로 한 단계 낮추세요.",
    },
    {
      id: "heading-structure",
      title: "헤딩 구조가 단계별로 자연스럽게 이어지지 않을 가능성이 큽니다",
      axis: "정보 계층",
      severity: "보통",
      category: "접근성",
      rationale:
        "큰 섹션에서 작은 카드로 넘어갈 때 제목 단계가 건너뛰면 스크린리더 탐색이 어려워집니다.",
      action:
        "각 주요 섹션에 하나의 기준 헤딩 레벨을 두고, 카드 제목은 그보다 하위 단계로 맞추세요.",
    },
    {
      id: "proof-density",
      title: "신뢰 요소가 첫 화면 아래로 늦게 배치됐을 수 있습니다",
      axis: "행동 유도",
      severity: context.hasCommerce ? "높음" : "보통",
      category: "콘텐츠",
      rationale:
        "사용자는 첫 의미 있는 클릭 전에 후기, 로고, 수치 같은 신뢰 신호를 보고 싶어 합니다.",
      action:
        "히어로와 가격 진입 구간 가까이에 고객사 로고, 사용 수치, 후기 요약을 앞당겨 배치하세요.",
    },
    {
      id: "mobile-spacing",
      title: "모바일에서 스크롤 공백이 길게 느껴질 가능성이 있습니다",
      axis: "밀도와 여백",
      severity: context.hasMobileRisk ? "높음" : "보통",
      category: "모바일",
      rationale:
        "세로 간격이 너무 크거나 미디어 블록이 과도하게 크면 작은 화면에서 정보 스캔이 느려집니다.",
      action:
        "모바일 섹션 패딩을 줄이고 카드 간격을 조정해 한 화면 안에 하나의 핵심 메시지가 들어오게 하세요.",
    },
    {
      id: "button-language",
      title: "버튼 문구가 의도 중심으로 더 구체화될 수 있습니다",
      axis: "행동 유도",
      severity: "낮음",
      category: "콘텐츠",
      rationale:
        "시작하기, 더 알아보기 같은 표현은 다음 결과가 보이지 않아 클릭 확신을 낮춥니다.",
      action:
        "UX 리포트 받기, 랜딩 비교 시작하기처럼 결과가 드러나는 행동 문구로 바꾸세요.",
    },
  ];

  if (context.hasDocs) {
    findings.push({
      id: "doc-navigation",
      title: "문서 탐색 구조가 신규 사용자에게 과하게 복잡할 수 있습니다",
      axis: "일관성",
      severity: "보통",
      category: "일관성",
      rationale:
        "사이드바가 촘촘한 문서형 제품은 입문 동선이 없으면 실제보다 더 어려워 보입니다.",
      action:
        "시작 가이드 경로를 따로 만들고, 역할이나 업무 기준으로 핵심 문서를 묶어 보여주세요.",
    });
  }

  const score = scoreFromFindings(findings);
  const sections: AuditSection[] = [
    {
      label: "명확성",
      score: Math.max(52, score - 8),
      summary: "시각적 인상은 좋지만, 메시지는 대상 사용자와 결과의 연결을 더 또렷하게 보여줄 필요가 있습니다.",
    },
    {
      label: "접근성",
      score: Math.max(48, score - 11),
      summary: "시맨틱 구조와 문구 디테일을 다듬는 것만으로도 폭넓은 사용성을 빠르게 개선할 수 있습니다.",
    },
    {
      label: "모바일",
      score: Math.max(50, score - (context.hasMobileRisk ? 14 : 9)),
      summary: "모바일에서도 동작은 가능해 보이지만, 정보 밀도와 섹션 리듬은 더 정교하게 다듬을 여지가 있습니다.",
    },
    {
      label: "전환",
      score: Math.max(46, score - (context.hasCommerce ? 12 : 9)),
      summary: "전반적인 흐름은 괜찮지만, 신뢰 요소와 CTA 강조는 더 앞쪽에서 드러나는 편이 좋습니다.",
    },
  ];

  return {
    target: label,
    score,
    stance:
      score >= 78 ? "컨셉은 강력하지만 실행 완성도는 아직 고르지 않습니다." : "제품 방향은 좋지만 분명한 UX 부채가 보입니다.",
    summary: `${label}는 제품 방향성 자체는 매력적이지만, 현재 경험은 사용자가 스스로 해석해야 하는 부분이 많아 보입니다. 가장 먼저 손볼 부분은 첫 화면 메시지의 선명도, 신뢰 요소의 배치 시점, 그리고 모바일 리듬의 정리입니다.`,
    sections,
    findings,
    highlights: [
      "수동 디자인 리뷰 전에 빠르게 문제 구간을 추리는 1차 UX 트리아지 레이어로 적합합니다.",
      "비용이 드는 모델 추론 전에 점검 포인트를 정리하는 참고 초안으로 사용할 수 있습니다.",
      "리포트 형식 자체를 포트폴리오 케이스 스터디나 클라이언트 제출물처럼 보이도록 구성했습니다.",
    ],
  };
}
