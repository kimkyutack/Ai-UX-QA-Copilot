const benchmarkSiteMap = {
  "linear.app": "Linear",
  "www.linear.app": "Linear",
  "stripe.com": "Stripe",
  "www.stripe.com": "Stripe",
  "notion.so": "Notion",
  "www.notion.so": "Notion",
  "notion.com": "Notion",
  "www.notion.com": "Notion",
} as const;

export function getHostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

export function getBenchmarkSiteLabel(url: string) {
  const hostname = getHostname(url);

  return benchmarkSiteMap[hostname as keyof typeof benchmarkSiteMap] ?? null;
}

export function isBenchmarkSite(url: string) {
  return Boolean(getBenchmarkSiteLabel(url));
}
