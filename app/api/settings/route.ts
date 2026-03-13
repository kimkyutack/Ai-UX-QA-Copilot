import { NextResponse } from "next/server";
import { getDefaultModel, isValidModel, listProviders } from "@/services/llm/models";
import { getWorkspaceAISettings, saveWorkspaceAISettings } from "@/services/repositories/workspace-settings-store";
import type { UpdateWorkspaceSettingsRequest } from "@/types/api/settings";

export async function GET() {
  const settings = await getWorkspaceAISettings();

  return NextResponse.json({
    settings: {
      provider: settings.provider,
      model: settings.model,
      storesApiKey: false,
      updatedAt: settings.updatedAt,
    },
    providers: listProviders(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as UpdateWorkspaceSettingsRequest;

  if (!body.provider) {
    return NextResponse.json({ error: "provider를 선택해 주세요." }, { status: 400 });
  }

  const model = body.model || getDefaultModel(body.provider);

  if (!isValidModel(body.provider, model)) {
    return NextResponse.json({ error: "선택한 provider에서 사용할 수 없는 모델입니다." }, { status: 400 });
  }

  const current = await getWorkspaceAISettings();
  const next = {
    ...current,
    provider: body.provider,
    model,
    updatedAt: new Date().toISOString(),
  };

  await saveWorkspaceAISettings(next);

  return NextResponse.json({
    settings: {
      provider: next.provider,
      model: next.model,
      storesApiKey: false,
      updatedAt: next.updatedAt,
    },
    providers: listProviders(),
  });
}
