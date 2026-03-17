import type { Project } from "@/types/domain/project";

export type ListProjectsResponse = {
  projects: Project[];
  error?: string;
};

export type CreateProjectRequest = {
  name: string;
};

export type CreateProjectResponse = {
  project?: Project;
  error?: string;
};
