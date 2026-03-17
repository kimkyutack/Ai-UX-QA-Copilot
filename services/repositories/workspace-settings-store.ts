import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDefaultModel } from "@/services/llm/models";
import { getPrismaClient } from "@/services/repositories/prisma-client";
import type { WorkspaceAISettings } from "@/types/domain/ai-settings";

const dataDir = path.join(process.cwd(), ".data");
const settingsFile = path.join(dataDir, "workspace-settings.json");
const defaultWorkspaceId = "demo-workspace";

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
}

async function readSettingsFile() {
  try {
    const content = await readFile(settingsFile, "utf8");
    return JSON.parse(content) as WorkspaceAISettings;
  } catch {
    return {
      workspaceId: defaultWorkspaceId,
      provider: "openai",
      model: getDefaultModel("openai"),
      updatedAt: new Date().toISOString(),
    } satisfies WorkspaceAISettings;
  }
}

export async function getWorkspaceAISettings() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return readSettingsFile();
  }

  const settings = await prisma.workspaceAISettings.findUnique({
    where: { workspaceId: defaultWorkspaceId },
  });

  if (!settings) {
    return {
      workspaceId: defaultWorkspaceId,
      provider: "openai",
      model: getDefaultModel("openai"),
      updatedAt: new Date().toISOString(),
    } satisfies WorkspaceAISettings;
  }

  return {
    workspaceId: settings.workspaceId,
    provider: settings.provider as WorkspaceAISettings["provider"],
    model: settings.model,
    updatedAt: settings.updatedAt.toISOString(),
  } satisfies WorkspaceAISettings;
}

export async function saveWorkspaceAISettings(settings: WorkspaceAISettings) {
  const prisma = getPrismaClient();

  if (prisma) {
    await prisma.workspaceAISettings.upsert({
      where: { workspaceId: settings.workspaceId },
      update: {
        provider: settings.provider,
        model: settings.model,
      },
      create: {
        workspaceId: settings.workspaceId,
        provider: settings.provider,
        model: settings.model,
      },
    });

    return settings;
  }

  await ensureStore();
  await writeFile(settingsFile, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}
