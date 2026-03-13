import { runSpecialistAgent } from "@/services/openai/run-specialist-agent";
import { synthesizeAuditReport } from "@/services/openai/synthesize-audit-report";
import { verifyAuditReport } from "@/services/orchestration/verify-audit-report";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type { PageContext } from "@/types/page-context";

export async function runAiAuditOrchestration(
  target: string,
  pageContext: PageContext,
  settings: ProviderRuntimeSettings,
) {
  const agentResults = await Promise.all([
    runSpecialistAgent("clarity", pageContext, settings),
    runSpecialistAgent("accessibility", pageContext, settings),
    runSpecialistAgent("conversion", pageContext, settings),
    runSpecialistAgent("mobile", pageContext, settings),
  ]);

  const synthesizedReport = await synthesizeAuditReport(target, pageContext, agentResults, settings);
  const verifiedReport = verifyAuditReport(synthesizedReport, agentResults);
  const agentTraces: AuditAgentTrace[] = agentResults.map((agent) => ({
    agent: agent.agent,
    score: agent.score,
    confidence: agent.confidence,
    summary: agent.summary,
  }));

  return {
    report: verifiedReport,
    agentTraces,
  };
}
