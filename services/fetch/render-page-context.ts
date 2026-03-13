import { chromium } from "playwright";
import { dedupeStrings } from "@/lib/html-utils";
import { withSignals } from "@/lib/page-context-utils";
import type { PageContext } from "@/types/page-context";

export async function fetchPageContextViaPlaywright(url: string): Promise<PageContext> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1800);

    const html = await page.content();
    const extracted = await page.evaluate(() => {
      const text = document.body?.innerText?.replace(/\s+/g, " ").trim() ?? "";
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean)
        .slice(0, 12);
      const buttons = Array.from(document.querySelectorAll("button, [role='button']"))
        .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean)
        .slice(0, 12);
      const links = Array.from(document.querySelectorAll("a"))
        .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean)
        .slice(0, 12);
      const meta = document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";

      return {
        title: document.title?.trim() ?? "",
        description: meta,
        headings,
        buttons,
        links,
        text,
      };
    });

    return withSignals(html, {
      url,
      title: extracted.title || "제목을 찾지 못했습니다.",
      description: extracted.description || "설명을 찾지 못했습니다.",
      headings: dedupeStrings(extracted.headings, 12),
      buttons: dedupeStrings(extracted.buttons, 12),
      links: dedupeStrings(extracted.links, 12),
      textSnippet: extracted.text.slice(0, 3500) || "본문 텍스트를 충분히 추출하지 못했습니다.",
      textLength: extracted.text.length,
      source: "playwright",
    });
  } finally {
    await browser.close();
  }
}
