import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPrismaClient } from "@/services/repositories/prisma-client";
import type { Project } from "@/types/domain/project";

const dataDir = path.join(process.cwd(), ".data");
const projectsFile = path.join(dataDir, "projects.json");
const defaultWorkspaceId = "demo-workspace";

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await ensureStore();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function mapPrismaProject(project: {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  targets?: { url: string }[];
}): Project {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    targetUrls: project.targets?.map((target) => target.url) ?? [],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function listProjects() {
  const prisma = getPrismaClient();

  if (!prisma) {
    const projects = await readJsonFile<Project[]>(projectsFile, []);
    if (projects.length) {
      return sortProjects(projects);
    }

    const seedProject: Project = {
      id: "demo-project",
      workspaceId: defaultWorkspaceId,
      name: "기본 프로젝트",
      targetUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await writeJsonFile(projectsFile, [seedProject]);
    return [seedProject];
  }

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      id: defaultWorkspaceId,
      name: "Demo Workspace",
      slug: "demo-workspace",
    },
  });

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    include: { targets: true },
  });

  if (projects.length) {
    return projects.map(mapPrismaProject);
  }

  const created = await prisma.project.create({
    data: {
      id: "demo-project",
      workspaceId: workspace.id,
      name: "기본 프로젝트",
    },
    include: { targets: true },
  });

  return [mapPrismaProject(created)];
}

export async function createProject(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("프로젝트 이름을 입력해 주세요.");
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    const projects = await listProjects();
    const nextProject: Project = {
      id: randomUUID(),
      workspaceId: defaultWorkspaceId,
      name: trimmed,
      targetUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextProjects = [nextProject, ...projects];
    await writeJsonFile(projectsFile, sortProjects(nextProjects));
    return nextProject;
  }

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      id: defaultWorkspaceId,
      name: "Demo Workspace",
      slug: "demo-workspace",
    },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: trimmed,
    },
    include: { targets: true },
  });

  return mapPrismaProject(project);
}
