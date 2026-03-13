import type {
  AIProvider,
  ProviderModelOption,
} from "@/types/domain/ai-settings";

export const providerCatalog: Record<
  AIProvider,
  { label: string; models: ProviderModelOption[] }
> = {
  openai: {
    label: "OpenAI",
    models: [
      {
        value: "gpt-5-mini",
        label: "GPT-5 mini",
        description: "빠르고 비용 효율적인 기본 추천 모델",
      },
      {
        value: "gpt-5",
        label: "GPT-5",
        description: "정교한 추론이 필요할 때 적합한 상위 모델",
      },
      {
        value: "gpt-5-nano",
        label: "GPT-5 nano",
        description: "가장 저렴한 텍스트 분류/요약용 모델",
      },
    ],
  },
  anthropic: {
    label: "Claude",
    models: [
      {
        value: "claude-sonnet-4-20250514",
        label: "Claude Sonnet 4",
        description: "고성능 범용 추론 모델",
      },
      {
        value: "claude-opus-4-20250514",
        label: "Claude Opus 4",
        description: "복잡한 판단에 적합한 상위 모델",
      },
      {
        value: "claude-3-5-haiku-20241022",
        label: "Claude Haiku 3.5",
        description: "빠르고 가벼운 분석용 모델",
      },
    ],
  },
};

export function getDefaultModel(provider: AIProvider) {
  return providerCatalog[provider].models[0].value;
}

export function listProviders() {
  return Object.entries(providerCatalog).map(([value, config]) => ({
    value: value as AIProvider,
    label: config.label,
    models: config.models,
  }));
}

export function isValidModel(provider: AIProvider, model: string) {
  return providerCatalog[provider].models.some((item) => item.value === model);
}
