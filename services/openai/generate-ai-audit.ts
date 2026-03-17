import { runAiAuditOrchestration } from "@/services/orchestration/run-ai-audit-orchestration";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AuditReport } from "@/types/audit";
import type { AnalysisMode } from "@/types/domain/analysis-mode";
import type {
  AuditAgentTrace,
  AuditOrchestrationHooks,
} from "@/types/domain/agent-run";
import type { PageContext } from "@/types/page-context";

export async function generateAiAuditReport(
  target: string,
  pageContext: PageContext,
  settings: ProviderRuntimeSettings,
  analysisMode: AnalysisMode,
  hooks?: AuditOrchestrationHooks,
): Promise<{ report: AuditReport; agentTraces: AuditAgentTrace[] }> {
  return runAiAuditOrchestration(target, pageContext, settings, analysisMode, hooks);
}
