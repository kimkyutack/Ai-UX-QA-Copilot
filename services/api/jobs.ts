import type {
  CreateJobRequest,
  CreateJobResponse,
  GetJobResponse,
} from "@/types/api/jobs";

export async function createAuditJobRequest(payload: CreateJobRequest) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as CreateJobResponse;
}

export async function fetchAuditJob(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}`, {
    cache: "no-store",
  });

  return (await response.json()) as GetJobResponse;
}

export async function runAuditJobRequest(
  jobId: string,
  payload: Pick<CreateJobRequest, "provider" | "model" | "apiKey" | "analysisMode">,
) {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as GetJobResponse;
}
