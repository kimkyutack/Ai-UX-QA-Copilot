import type { ListReportsResponse } from "@/types/api/reports";

export async function fetchAuditReports(targetUrl?: string, limit = 10) {
  const searchParams = new URLSearchParams();

  if (targetUrl) {
    searchParams.set("targetUrl", targetUrl);
  }

  searchParams.set("limit", String(limit));

  const response = await fetch(`/api/reports?${searchParams.toString()}`, {
    cache: "no-store",
  });

  return (await response.json()) as ListReportsResponse;
}
