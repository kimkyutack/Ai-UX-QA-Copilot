import type {
  CreateProjectRequest,
  CreateProjectResponse,
  ListProjectsResponse,
} from "@/types/api/projects";

export async function fetchProjects() {
  const response = await fetch("/api/projects", {
    cache: "no-store",
  });

  return (await response.json()) as ListProjectsResponse;
}

export async function createProjectRequest(payload: CreateProjectRequest) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as CreateProjectResponse;
}
