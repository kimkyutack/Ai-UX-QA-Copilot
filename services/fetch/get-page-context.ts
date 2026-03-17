import { fetchPageContextViaHttp } from "@/services/fetch/fetch-page-context";
import { fetchPageContextViaPlaywright } from "@/services/fetch/render-page-context";
import type { PageContext } from "@/types/page-context";

export async function getPageContext(url: string): Promise<PageContext> {
  const httpContext = await fetchPageContextViaHttp(url);

  try {
    const renderedContext = await fetchPageContextViaPlaywright(url);

    const renderedLooksStronger =
      renderedContext.signalScore >= httpContext.signalScore - 1 ||
      renderedContext.textLength > httpContext.textLength ||
      renderedContext.headings.length >= httpContext.headings.length;

    if (renderedLooksStronger) {
      return renderedContext;
    }

    return {
      ...httpContext,
      screenshotDataUrl: renderedContext.screenshotDataUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Playwright 렌더링에 실패했습니다.";

    return {
      ...httpContext,
      warnings: [...httpContext.warnings, `Playwright 렌더링 실패: ${message}`],
    };
  }
}
