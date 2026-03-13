import type { UpdateWorkspaceSettingsRequest, WorkspaceSettingsResponse } from "@/types/api/settings";

export async function fetchWorkspaceSettings() {
  const response = await fetch("/api/settings", { cache: "no-store" });
  return (await response.json()) as WorkspaceSettingsResponse;
}

export async function updateWorkspaceSettings(payload: UpdateWorkspaceSettingsRequest) {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as WorkspaceSettingsResponse;
}
