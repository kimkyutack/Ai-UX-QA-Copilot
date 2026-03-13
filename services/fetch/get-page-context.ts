import { fetchPageContextViaHttp } from "@/services/fetch/fetch-page-context";
import { fetchPageContextViaPlaywright } from "@/services/fetch/render-page-context";
import type { PageContext } from "@/types/page-context";

export async function getPageContext(url: string): Promise<PageContext> {
  const httpContext = await fetchPageContextViaHttp(url);

  if (httpContext.signalScore >= 6 && httpContext.warnings.length === 0) {
    return httpContext;
  }

  try {
    const renderedContext = await fetchPageContextViaPlaywright(url);
    return renderedContext.signalScore >= httpContext.signalScore ? renderedContext : httpContext;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Playwright 렌더링에 실패했습니다.";

    return {
      ...httpContext,
      warnings: [...httpContext.warnings, `Playwright 렌더링 실패: ${message}`],
    };
  }
}
