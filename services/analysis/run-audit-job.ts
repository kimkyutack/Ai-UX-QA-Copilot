import { randomUUID } from "node:crypto";
import { getPageContext } from "@/services/fetch/get-page-context";
import {
  getActiveProviderSettings,
  type ProviderRequestSettings,
} from "@/services/llm/provider-settings";
import { generateAiAuditReport } from "@/services/openai/generate-ai-audit";
import {
  createAuditJob,
  saveAuditReport,
  updateAuditJob,
} from "@/services/repositories/audit-store";
import type { AuditAgentTrace } from "@/types/domain/agent-run";
import type {
  AuditJob,
  AuditJobAgentState,
  AuditJobPreview,
  AuditJobStage,
} from "@/types/domain/audit-job";
import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { AIProvider } from "@/types/domain/ai-settings";
import type { AnalysisMode } from "@/types/domain/analysis-mode";

const defaultProjectId = "demo-project";
const baseAgentStates: AuditJobAgentState[] = [
  { agent: "clarity", status: "queued" },
  { agent: "accessibility", status: "queued" },
  { agent: "conversion", status: "queued" },
  { agent: "mobile", status: "queued" },
];

function buildDebugPayload(
  pageContext: Awaited<ReturnType<typeof getPageContext>>,
  options?: {
    provider?: AIProvider;
    model?: string;
    analysisMode?: AnalysisMode;
    agentTraces?: AuditAgentTrace[];
  },
) {
  return {
    analysisMode: options?.analysisMode,
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
    screenshotDataUrl: pageContext.screenshotDataUrl,
    agentTraces: options?.agentTraces,
  };
}

function stageLabel(stage: AuditJobStage) {
  switch (stage) {
    case "queued":
      return "분석 대기열에 등록했습니다.";
    case "collecting":
      return "페이지 HTML과 렌더 결과를 수집하고 있습니다.";
    case "analyzing":
      return "전문 에이전트가 섹션별 분석을 진행하고 있습니다.";
    case "synthesizing":
      return "에이전트 결과를 하나의 리포트로 정리하고 있습니다.";
    case "localizing":
      return "리포트 문장을 한국어로 다듬고 있습니다.";
    case "persisting":
      return "리포트와 디버그 정보를 저장하고 있습니다.";
    case "completed":
      return "분석이 완료되었습니다.";
    case "failed":
      return "분석 중 문제가 발생했습니다.";
    default:
      return "분석 상태를 준비 중입니다.";
  }
}

function agentLabel(agent: AuditJobAgentState["agent"]) {
  switch (agent) {
    case "clarity":
      return "명확성";
    case "accessibility":
      return "접근성";
    case "conversion":
      return "전환";
    case "mobile":
      return "모바일";
    case "visual":
      return "비주얼";
    default:
      return agent;
  }
}

function buildPreview(
  targetUrl: string,
  title: string | undefined,
  states: AuditJobAgentState[] | undefined,
): AuditJobPreview | undefined {
  const completed = (states ?? []).filter(
    (item) => item.status === "completed" && item.summary,
  );

  if (!completed.length) {
    return undefined;
  }

  const domainLabel = targetUrl.replace(/^https?:\/\//, "");
  return {
    stance: title?.trim()
      ? `${title.trim()} 페이지 초안 리포트`
      : `${domainLabel} 분석 초안`,
    summary:
      completed.length >= 3
        ? "완료된 에이전트 결과를 먼저 정리한 초안입니다. 최종 종합 리포트가 이어서 반영됩니다."
        : "에이전트별 분석 결과를 순차적으로 모으고 있습니다. 아래 초안은 현재까지 확인된 요약입니다.",
    highlights: completed.slice(0, 3).map((item) => item.summary as string),
    sections: completed.map((item) => ({
      label: agentLabel(item.agent),
      summary: item.summary as string,
      score: item.score,
    })),
  };
}

async function setJobStage(
  jobId: string,
  stage: AuditJobStage,
  options?: {
    status?: AuditJob["status"];
    signalScore?: number;
    source?: AuditJob["source"];
    errorMessage?: string;
    agentStates?: AuditJobAgentState[];
    preview?: AuditJobPreview;
  },
) {
  return updateAuditJob(jobId, (current) => ({
    ...current,
    status: options?.status ?? current.status,
    stage,
    stageLabel: stageLabel(stage),
    signalScore: options?.signalScore ?? current.signalScore,
    source: options?.source ?? current.source,
    errorMessage: options?.errorMessage,
    agentStates: options?.agentStates ?? current.agentStates,
    preview: options?.preview ?? current.preview,
    updatedAt: new Date().toISOString(),
  }));
}

function updateAgentStates(
  currentStates: AuditJobAgentState[] | undefined,
  nextState: AuditJobAgentState,
) {
  const map = new Map((currentStates ?? []).map((item) => [item.agent, item]));
  map.set(nextState.agent, {
    ...map.get(nextState.agent),
    ...nextState,
  });

  return Array.from(map.values());
}

export async function createQueuedAuditJob(input: {
  url: string;
  projectId?: string;
  analysisMode?: AnalysisMode;
}) {
  const now = new Date().toISOString();
  const job: AuditJob = {
    id: randomUUID(),
    projectId: input.projectId ?? defaultProjectId,
    targetUrl: input.url,
    analysisMode: input.analysisMode ?? "saas",
    status: "queued",
    stage: "queued",
    stageLabel: stageLabel("queued"),
    createdAt: now,
    updatedAt: now,
    agentStates: baseAgentStates,
    preview: undefined,
  };

  await createAuditJob(job);
  return job;
}

export async function processAuditJob(
  jobId: string,
  input: {
    url: string;
    projectId?: string;
    analysisMode?: AnalysisMode;
    providerSettings?: ProviderRequestSettings;
  },
) {
  await setJobStage(jobId, "collecting", { status: "running" });

  try {
    const providerSettings = await getActiveProviderSettings(
      input.providerSettings,
    );
    const pageContext = await getPageContext(input.url);
    const initialAgentStates: AuditJobAgentState[] = pageContext.screenshotDataUrl
      ? [...baseAgentStates, { agent: "visual", status: "queued" }]
      : [...baseAgentStates];

    await setJobStage(jobId, "analyzing", {
      status: "running",
      signalScore: pageContext.signalScore,
      source: pageContext.source,
      agentStates: initialAgentStates,
    });

    const debug = buildDebugPayload(pageContext, {
      provider: providerSettings.provider,
      model: providerSettings.model,
      analysisMode: input.analysisMode,
    });

    if (pageContext.signalScore < 4) {
      const message =
        "대상 페이지에서 충분한 텍스트 근거를 추출하지 못했습니다. 봇 차단 페이지이거나 JavaScript 렌더링이 강한 사이트일 수 있습니다.";

      const failedJob = await setJobStage(jobId, "failed", {
        status: "failed",
        signalScore: pageContext.signalScore,
        source: pageContext.source,
        errorMessage: message,
        agentStates: initialAgentStates,
      });

      return {
        job: failedJob,
        error: message,
        debug,
      };
    }

    const orchestrated = await generateAiAuditReport(
      input.url,
      pageContext,
      providerSettings,
      input.analysisMode ?? "saas",
      {
        onStageChange: async (nextStage) => {
          await updateAuditJob(jobId, (current) => ({
            ...current,
            status: "running",
            stage: nextStage.value,
            stageLabel: nextStage.label,
            signalScore: pageContext.signalScore,
            source: pageContext.source,
            preview: buildPreview(
              input.url,
              pageContext.title,
              current.agentStates,
            ),
            updatedAt: new Date().toISOString(),
          }));
        },
        onAgentStart: async (agent) => {
          await updateAuditJob(jobId, (current) => ({
            ...current,
            status: "running",
            stage: "analyzing",
            stageLabel: stageLabel("analyzing"),
            agentStates: updateAgentStates(current.agentStates, {
              agent,
              status: "running",
            }),
            preview: buildPreview(
              input.url,
              pageContext.title,
              current.agentStates,
            ),
            updatedAt: new Date().toISOString(),
          }));
        },
        onAgentComplete: async (trace) => {
          await updateAuditJob(jobId, (current) => ({
            ...current,
            status: "running",
            stage: "analyzing",
            stageLabel: stageLabel("analyzing"),
            agentStates: updateAgentStates(current.agentStates, {
              agent: trace.agent,
              status: "completed",
              score: trace.score,
              confidence: trace.confidence,
              summary: trace.summary,
            }),
            preview: buildPreview(
              input.url,
              pageContext.title,
              updateAgentStates(current.agentStates, {
                agent: trace.agent,
                status: "completed",
                score: trace.score,
                confidence: trace.confidence,
                summary: trace.summary,
              }),
            ),
            updatedAt: new Date().toISOString(),
          }));
        },
      },
    );

    await setJobStage(jobId, "persisting", {
      status: "running",
      signalScore: pageContext.signalScore,
      source: pageContext.source,
    });

    const reportRecord: AuditReportRecord = {
      id: randomUUID(),
      jobId,
      projectId: input.projectId ?? defaultProjectId,
      targetUrl: input.url,
      createdAt: new Date().toISOString(),
      report: orchestrated.report,
      debug: buildDebugPayload(pageContext, {
        provider: providerSettings.provider,
        model: providerSettings.model,
        analysisMode: input.analysisMode,
        agentTraces: orchestrated.agentTraces,
      }),
    };

    await saveAuditReport(reportRecord);
    const completedJob = await updateAuditJob(jobId, (current) => ({
      ...current,
      status: "completed",
      stage: "completed",
      stageLabel: stageLabel("completed"),
      updatedAt: new Date().toISOString(),
      reportId: reportRecord.id,
      signalScore: pageContext.signalScore,
      source: pageContext.source,
      agentStates: current.agentStates?.map((item) =>
        item.status === "completed" ? item : { ...item, status: "completed" },
      ),
      preview: {
        stance: reportRecord.report.stance,
        summary: reportRecord.report.summary,
        highlights: reportRecord.report.highlights,
        sections: reportRecord.report.sections.map((section) => ({
          label: section.label,
          summary: section.summary,
          score: section.score,
        })),
      },
    }));

    return {
      job: completedJob,
      report: reportRecord,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 분석 중 오류가 발생했습니다.";
    const failedJob = await setJobStage(jobId, "failed", {
      status: "failed",
      errorMessage: message,
    });

    return {
      job: failedJob,
      error: message,
    };
  }
}

export async function runAuditJob(input: {
  url: string;
  projectId?: string;
  analysisMode?: AnalysisMode;
  providerSettings?: ProviderRequestSettings;
}) {
  const job = await createQueuedAuditJob(input);
  return processAuditJob(job.id, input);
}
