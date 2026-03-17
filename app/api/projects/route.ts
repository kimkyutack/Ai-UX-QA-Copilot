import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/services/repositories/project-store";
import type { CreateProjectRequest } from "@/types/api/projects";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateProjectRequest>;

  try {
    const project = await createProject(body.name ?? "");
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "프로젝트를 생성하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
