import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDefaultModel } from "@/services/llm/models";
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
  return readSettingsFile();
}

export async function saveWorkspaceAISettings(settings: WorkspaceAISettings) {
  await ensureStore();
  await writeFile(settingsFile, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}
