export type AnalysisMode =
  | "saas"
  | "ecommerce"
  | "portfolio"
  | "recruiting"
  | "docs";

export const analysisModeOptions: Array<{
  value: AnalysisMode;
  label: string;
  description: string;
}> = [
  {
    value: "saas",
    label: "SaaS 랜딩",
    description: "가치 제안, 제품 이해, CTA 흐름, 신뢰 요소를 중심으로 봅니다.",
  },
  {
    value: "ecommerce",
    label: "이커머스",
    description: "상품 이해, 구매 동선, 가격/혜택 전달, 신뢰와 전환 마찰을 봅니다.",
  },
  {
    value: "portfolio",
    label: "포트폴리오",
    description: "자기소개 명확성, 대표 작업 노출, 신뢰 형성, 문의 전환을 봅니다.",
  },
  {
    value: "recruiting",
    label: "채용 페이지",
    description: "포지션 이해, 지원 동선, 문화/보상 정보, 지원 설득력을 봅니다.",
  },
  {
    value: "docs",
    label: "문서/가이드",
    description: "탐색 구조, 스캔 가능성, 예제 접근성, 학습 흐름을 봅니다.",
  },
];
