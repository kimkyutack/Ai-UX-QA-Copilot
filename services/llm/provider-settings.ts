import { getDefaultModel } from "@/services/llm/models";
import { getWorkspaceAISettings } from "@/services/repositories/workspace-settings-store";
import type { AIProvider } from "@/types/domain/ai-settings";

export type ProviderRuntimeSettings = {
  provider: AIProvider;
  model: string;
  apiKey: string;
};

export type ProviderRequestSettings = {
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
};

export async function getActiveProviderSettings(overrides?: ProviderRequestSettings): Promise<ProviderRuntimeSettings> {
  const saved = await getWorkspaceAISettings();
  const provider = overrides?.provider ?? saved.provider ?? "openai";
  const model = overrides?.model ?? saved.model ?? getDefaultModel(provider);
  const apiKey = overrides?.apiKey?.trim();

  if (apiKey) {
    return {
      provider,
      model,
      apiKey,
    };
  }

  if (process.env.OPENAI_API_KEY && provider === "openai") {
    return {
      provider: "openai",
      model: model || process.env.OPENAI_MODEL || getDefaultModel("openai"),
      apiKey: process.env.OPENAI_API_KEY,
    };
  }

  throw new Error("API key를 입력해 주세요. 이 서비스는 키를 저장하지 않고 요청 시에만 사용합니다.");
}
