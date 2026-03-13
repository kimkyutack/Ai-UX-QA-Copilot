export type AIProvider = "openai" | "anthropic";

export type ProviderModelOption = {
  value: string;
  label: string;
  description: string;
};

export type WorkspaceAISettings = {
  workspaceId: string;
  provider: AIProvider;
  model: string;
  updatedAt: string;
};
