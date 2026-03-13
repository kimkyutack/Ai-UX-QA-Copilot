import type { AIProvider, ProviderModelOption } from "@/types/domain/ai-settings";

export type WorkspaceSettingsResponse = {
  settings: {
    provider: AIProvider;
    model: string;
    storesApiKey: false;
    updatedAt?: string;
  };
  providers: Array<{
    value: AIProvider;
    label: string;
    models: ProviderModelOption[];
  }>;
  error?: string;
};

export type UpdateWorkspaceSettingsRequest = {
  provider: AIProvider;
  model: string;
};
