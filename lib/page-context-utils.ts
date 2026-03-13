import type { PageContext } from "@/types/page-context";

const challengePatterns = [
  /enable javascript/i,
  /just a moment/i,
  /attention required/i,
  /verify you are human/i,
  /cloudflare/i,
  /captcha/i,
  /access denied/i,
];

type BaseContext = Omit<PageContext, "signalScore" | "warnings">;

export function calculateSignalScore(context: BaseContext) {
  let score = 0;

  if (!context.title.includes("찾지 못했습니다")) score += 2;
  if (!context.description.includes("찾지 못했습니다")) score += 2;
  if (context.headings.length > 0) score += 2;
  if (context.buttons.length > 0) score += 1;
  if (context.links.length > 0) score += 1;
  if (context.textLength > 400) score += 2;
  if (context.textLength > 1200) score += 2;
  if (context.source === "playwright") score += 1;

  return score;
}

export function detectWarnings(rawText: string, context: BaseContext) {
  const warnings: string[] = [];
  const normalized = `${context.title} ${context.description} ${context.textSnippet}`.toLowerCase();

  if (challengePatterns.some((pattern) => pattern.test(rawText) || pattern.test(normalized))) {
    warnings.push("페이지가 봇 차단 또는 검증 화면일 수 있어 실제 본문을 충분히 읽지 못했을 가능성이 있습니다.");
  }

  if (context.textLength < 300) {
    warnings.push("추출한 본문 텍스트가 매우 짧아 분석 근거가 제한적입니다.");
  }

  if (context.headings.length === 0) {
    warnings.push("헤딩을 찾지 못해 정보 구조 판단 근거가 약합니다.");
  }

  return warnings;
}

export function withSignals(rawText: string, context: BaseContext): PageContext {
  return {
    ...context,
    signalScore: calculateSignalScore(context),
    warnings: detectWarnings(rawText, context),
  };
}
