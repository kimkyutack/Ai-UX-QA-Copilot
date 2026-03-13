import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";

type StructuredGenerationInput = {
  schemaName: string;
  schema: Record<string, unknown>;
  systemText: string;
  userPayload: unknown;
};

function extractJsonBlock(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("모델 응답에서 JSON 결과를 찾지 못했습니다.");
  }

  return value.slice(start, end + 1);
}

async function runOpenAIStructuredGeneration(input: StructuredGenerationInput, apiKey: string, model: string) {
  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model,
    reasoning: { effort: "medium" },
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: input.schemaName,
        strict: true,
        schema: input.schema,
      },
    },
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: input.systemText }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(input.userPayload) }],
      },
    ],
  });

  return JSON.parse(extractJsonBlock(response.output_text));
}

async function runAnthropicStructuredGeneration(input: StructuredGenerationInput, apiKey: string, model: string) {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 3000,
    system: [
      input.systemText,
      "반드시 JSON만 출력하세요.",
      "아래 JSON schema를 만족해야 합니다.",
      JSON.stringify(input.schema),
    ].join("\n\n"),
    messages: [
      {
        role: "user",
        content: JSON.stringify(input.userPayload),
      },
    ],
  });

  const text = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return JSON.parse(extractJsonBlock(text));
}

export async function runStructuredGeneration(input: StructuredGenerationInput, settings: ProviderRuntimeSettings) {
  if (settings.provider === "anthropic") {
    const parsed = await runAnthropicStructuredGeneration(input, settings.apiKey, settings.model);
    return { parsed, provider: settings.provider, model: settings.model };
  }

  const parsed = await runOpenAIStructuredGeneration(input, settings.apiKey, settings.model);
  return { parsed, provider: settings.provider, model: settings.model };
}
