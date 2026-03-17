import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";

type StructuredGenerationImage = {
  dataUrl: string;
  mediaType: "image/jpeg" | "image/png";
};

type StructuredGenerationInput = {
  schemaName: string;
  schema: Record<string, unknown>;
  systemText: string;
  userPayload: unknown;
  images?: StructuredGenerationImage[];
};

function extractJsonBlock(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("모델 응답에서 JSON 결과를 찾지 못했습니다.");
  }

  return value.slice(start, end + 1);
}

function stripDataUrlPrefix(dataUrl: string) {
  const marker = "base64,";
  const index = dataUrl.indexOf(marker);
  return index === -1 ? dataUrl : dataUrl.slice(index + marker.length);
}

async function runOpenAIStructuredGeneration(input: StructuredGenerationInput, apiKey: string, model: string) {
  const client = new OpenAI({ apiKey });
  const userContent: Array<Record<string, unknown>> = [
    { type: "input_text", text: JSON.stringify(input.userPayload) },
  ];

  for (const image of input.images ?? []) {
    userContent.push({
      type: "input_image",
      image_url: image.dataUrl,
    });
  }

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
        content: userContent as never,
      },
    ],
  });

  return JSON.parse(extractJsonBlock(response.output_text));
}

async function runAnthropicStructuredGeneration(input: StructuredGenerationInput, apiKey: string, model: string) {
  const client = new Anthropic({ apiKey });
  const messageContent: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: JSON.stringify(input.userPayload),
    },
  ];

  for (const image of input.images ?? []) {
    messageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType,
        data: stripDataUrlPrefix(image.dataUrl),
      },
    });
  }

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
        content: messageContent as never,
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
