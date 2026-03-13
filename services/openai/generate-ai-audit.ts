import { runAiAuditOrchestration } from "@/services/orchestration/run-ai-audit-orchestration";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AuditReport } from "@/types/audit";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type { PageContext } from "@/types/page-context";

export async function generateAiAuditReport(
  target: string,
  pageContext: PageContext,
  settings: ProviderRuntimeSettings,
): Promise<{ report: AuditReport; agentTraces: AuditAgentTrace[] }> {
  return runAiAuditOrchestration(target, pageContext, settings);
}
