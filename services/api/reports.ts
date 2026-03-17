import type {
  GetReportResponse,
  ListReportsResponse,
  UpdateReportFindingPayload,
  UpdateReportResponse,
} from "@/types/api/reports";

export async function fetchAuditReports(options?: {
  targetUrl?: string;
  projectId?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (options?.targetUrl) {
    searchParams.set("targetUrl", options.targetUrl);
  }

  if (options?.projectId) {
    searchParams.set("projectId", options.projectId);
  }

  searchParams.set("limit", String(options?.limit ?? 10));

  const response = await fetch(`/api/reports?${searchParams.toString()}`, {
    cache: "no-store",
  });

  return (await response.json()) as ListReportsResponse;
}

export async function fetchAuditReport(reportId: string) {
  const response = await fetch(`/api/reports/${reportId}`, {
    cache: "no-store",
  });

  return (await response.json()) as GetReportResponse;
}

export async function updateAuditReportFinding(
  reportId: string,
  payload: UpdateReportFindingPayload,
) {
  const response = await fetch(`/api/reports/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as UpdateReportResponse;
}
