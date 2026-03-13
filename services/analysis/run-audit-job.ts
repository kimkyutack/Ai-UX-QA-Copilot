import { randomUUID } from "node:crypto";
import { getPageContext } from "@/services/fetch/get-page-context";
import { getActiveProviderSettings, type ProviderRequestSettings } from "@/services/llm/provider-settings";
import { generateAiAuditReport } from "@/services/openai/generate-ai-audit";
import { createAuditJob, saveAuditReport, updateAuditJob } from "@/services/repositories/audit-store";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type { AuditJob } from "@/types/domain/audit-job";
import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { AIProvider } from "@/types/domain/ai-settings";

const defaultProjectId = "demo-project";

function buildDebugPayload(
  pageContext: Awaited<ReturnType<typeof getPageContext>>,
  options?: {
    provider?: AIProvider;
    model?: string;
    agentTraces?: AuditAgentTrace[];
  },
) {
  return {
    signalScore: pageContext.signalScore,
    warnings: pageContext.warnings,
    source: pageContext.source,
    provider: options?.provider,
    model: options?.model,
    title: pageContext.title,
    description: pageContext.description,
    headings: pageContext.headings,
    buttons: pageContext.buttons,
    links: pageContext.links.slice(0, 8),
    textSnippet: pageContext.textSnippet,
    agentTraces: options?.agentTraces,
  };
}

export async function runAuditJob(input: { url: string; projectId?: string; providerSettings?: ProviderRequestSettings }) {
  const now = new Date().toISOString();
  const job: AuditJob = {
    id: randomUUID(),
    projectId: input.projectId ?? defaultProjectId,
    targetUrl: input.url,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };

  await createAuditJob(job);
  await updateAuditJob(job.id, (current) => ({ ...current, status: "running", updatedAt: new Date().toISOString() }));

  try {
    const providerSettings = await getActiveProviderSettings(input.providerSettings);
    const pageContext = await getPageContext(input.url);
    const debug = buildDebugPayload(pageContext, {
      provider: providerSettings.provider,
      model: providerSettings.model,
    });

    if (pageContext.signalScore < 4) {
      const message =
        "대상 페이지에서 충분한 텍스트 근거를 추출하지 못했습니다. 봇 차단 페이지이거나 JavaScript 렌더링이 강한 사이트일 수 있습니다.";

      const failedJob = await updateAuditJob(job.id, (current) => ({
        ...current,
        status: "failed",
        updatedAt: new Date().toISOString(),
        errorMessage: message,
        signalScore: pageContext.signalScore,
        source: pageContext.source,
      }));

      return {
        job: failedJob ?? job,
        error: message,
        debug,
      };
    }

    const orchestrated = await generateAiAuditReport(input.url, pageContext, providerSettings);
    const reportRecord: AuditReportRecord = {
      id: randomUUID(),
      jobId: job.id,
      projectId: job.projectId,
      targetUrl: input.url,
      createdAt: new Date().toISOString(),
      report: orchestrated.report,
      debug: buildDebugPayload(pageContext, {
        provider: providerSettings.provider,
        model: providerSettings.model,
        agentTraces: orchestrated.agentTraces,
      }),
    };

    await saveAuditReport(reportRecord);
    const completedJob = await updateAuditJob(job.id, (current) => ({
      ...current,
      status: "completed",
      updatedAt: new Date().toISOString(),
      reportId: reportRecord.id,
      signalScore: pageContext.signalScore,
      source: pageContext.source,
    }));

    return {
      job: completedJob ?? job,
      report: reportRecord,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 분석 중 오류가 발생했습니다.";
    const failedJob = await updateAuditJob(job.id, (current) => ({
      ...current,
      status: "failed",
      updatedAt: new Date().toISOString(),
      errorMessage: message,
    }));

    return {
      job: failedJob ?? job,
      error: message,
    };
  }
}
