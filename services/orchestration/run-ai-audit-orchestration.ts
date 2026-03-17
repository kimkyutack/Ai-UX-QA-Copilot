import { runSpecialistAgent } from "@/services/openai/run-specialist-agent";
import { synthesizeAuditReport } from "@/services/openai/synthesize-audit-report";
import { localizeAuditOutput } from "@/services/orchestration/localize-audit-output";
import { verifyAuditReport } from "@/services/orchestration/verify-audit-report";
import type { ProviderRuntimeSettings } from "@/services/llm/provider-settings";
import type { AnalysisMode } from "@/types/domain/analysis-mode";
import type {
  AuditAgentTrace,
  AuditOrchestrationHooks,
} from "@/types/domain/agent-run";
import type { PageContext } from "@/types/page-context";

export async function runAiAuditOrchestration(
  target: string,
  pageContext: PageContext,
  settings: ProviderRuntimeSettings,
  analysisMode: AnalysisMode,
  hooks?: AuditOrchestrationHooks,
) {
  await hooks?.onStageChange?.({
    value: "analyzing",
    label: "전문 에이전트가 섹션별 분석을 시작했습니다.",
  });

  const agentQueue = [
    "clarity",
    "accessibility",
    "conversion",
    "mobile",
  ] as const;
  const jobs = agentQueue.map(async (agent) => {
    await hooks?.onAgentStart?.(agent);
    const result = await runSpecialistAgent(agent, pageContext, settings, analysisMode);
    await hooks?.onAgentComplete?.({
      agent: result.agent,
      score: result.score,
      confidence: result.confidence,
      summary: result.summary,
    });
    return result;
  });

  if (pageContext.screenshotDataUrl) {
    jobs.push((async () => {
      await hooks?.onAgentStart?.("visual");
      const result = await runSpecialistAgent("visual", pageContext, settings, analysisMode);
      await hooks?.onAgentComplete?.({
        agent: result.agent,
        score: result.score,
        confidence: result.confidence,
        summary: result.summary,
      });
      return result;
    })());
  }

  const agentResults = await Promise.all(jobs);
  await hooks?.onStageChange?.({
    value: "synthesizing",
    label: "에이전트 결과를 종합 리포트로 정리하고 있습니다.",
  });
  const synthesizedReport = await synthesizeAuditReport(target, pageContext, agentResults, settings, analysisMode);
  const verifiedReport = verifyAuditReport(synthesizedReport, agentResults);
  const agentTraces: AuditAgentTrace[] = agentResults.map((agent) => ({
    agent: agent.agent,
    score: agent.score,
    confidence: agent.confidence,
    summary: agent.summary,
  }));
  await hooks?.onStageChange?.({
    value: "localizing",
    label: "설명 문장을 자연스러운 한국어로 다듬고 있습니다.",
  });
  const localizedOutput = await localizeAuditOutput(verifiedReport, agentTraces, settings);

  return {
    report: localizedOutput.report,
    agentTraces: localizedOutput.agentTraces,
  };
}
