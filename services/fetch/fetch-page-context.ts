import { cleanupText, dedupeStrings } from "@/lib/html-utils";
import { withSignals } from "@/lib/page-context-utils";
import type { PageContext } from "@/types/page-context";

function extractMatches(html: string, pattern: RegExp, limit: number) {
  return dedupeStrings(Array.from(html.matchAll(pattern)).map((match) => cleanupText(match[1] ?? "")).filter(Boolean), limit);
}

export async function fetchPageContextViaHttp(url: string): Promise<PageContext> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; UXAuditCopilot/1.0; +https://example.com/bot)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`대상 페이지를 불러오지 못했습니다. (${response.status})`);
  }

  const html = await response.text();
  const title = cleanupText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || "제목을 찾지 못했습니다.";
  const description =
    cleanupText(
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] ??
        html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i)?.[1] ??
        "",
    ) || "설명을 찾지 못했습니다.";

  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const cleanedBody = cleanupText(body);

  return withSignals(html, {
    url,
    title,
    description,
    headings: extractMatches(html, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, 12),
    buttons: extractMatches(html, /<button[^>]*>([\s\S]*?)<\/button>/gi, 12),
    links: extractMatches(html, /<a[^>]*>([\s\S]*?)<\/a>/gi, 12),
    textSnippet: cleanedBody.slice(0, 3500) || "본문 텍스트를 충분히 추출하지 못했습니다.",
    textLength: cleanedBody.length,
    source: "fetch",
  });
}
