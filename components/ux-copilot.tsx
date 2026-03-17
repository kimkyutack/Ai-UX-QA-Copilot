"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { compareAuditReports } from "@/lib/compare-audit-reports";
import type { AnalyzeResponse } from "@/services/api/analyze";
import {
  createAuditJobRequest,
  fetchAuditJob,
  runAuditJobRequest,
} from "@/services/api/jobs";
import { fetchAuditReports } from "@/services/api/reports";
import {
  fetchWorkspaceSettings,
  updateWorkspaceSettings,
} from "@/services/api/settings";
import type { AuditFinding, AuditReport, Severity } from "@/types/audit";
import type { WorkspaceSettingsResponse } from "@/types/api/settings";
import type { AuditJob } from "@/types/domain/audit-job";
import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { AIProvider } from "@/types/domain/ai-settings";
import styles from "./ux-copilot.module.css";

type ReportViewMode = "overview" | "design" | "pm" | "marketing";

const sampleTargets = ["stripe.com", "notion.so", "vercel.com", "linear.app"];
const loadingSteps = [
  "페이지 기본 HTML을 수집하고 있습니다",
  "필요하면 브라우저 렌더링으로 본문을 다시 읽고 있습니다",
  "전문 에이전트가 명확성, 전환, 접근성, 모바일, 비주얼 관점으로 분석을 병렬로 수행하고 있습니다",
  "종합 에이전트가 최종 리포트를 정리하고 있습니다",
];

const severityClassMap: Record<Severity, string> = {
  치명: styles.critical,
  높음: styles.high,
  보통: styles.medium,
  낮음: styles.low,
};

const agentLabelMap = {
  clarity: "명확성",
  accessibility: "접근성",
  conversion: "전환",
  mobile: "모바일",
  visual: "비주얼",
} as const;

function getAgentStatusLabel(
  status: "queued" | "running" | "completed" | "failed",
) {
  switch (status) {
    case "completed":
      return "완료";
    case "running":
      return "진행 중";
    case "failed":
      return "실패";
    default:
      return "대기";
  }
}

function getAgentProgressValue(
  status: "queued" | "running" | "completed" | "failed",
) {
  switch (status) {
    case "completed":
      return 100;
    case "running":
      return 62;
    case "failed":
      return 100;
    default:
      return 12;
  }
}

function matchesViewMode(finding: AuditFinding, mode: ReportViewMode) {
  if (mode === "overview") {
    return true;
  }

  if (mode === "design") {
    return (
      finding.category === "접근성" ||
      finding.category === "일관성" ||
      finding.category === "모바일"
    );
  }

  if (mode === "pm") {
    return (
      finding.severity === "치명" ||
      finding.severity === "높음" ||
      finding.category === "전환"
    );
  }

  return /CTA|카피|문구|전환|설득|신뢰/i.test(
    `${finding.title} ${finding.rationale} ${finding.action}`,
  );
}

function buildViewHeadline(mode: ReportViewMode) {
  switch (mode) {
    case "design":
      return "레이아웃, 스캔 흐름, 모바일 사용성을 먼저 보는 정리입니다.";
    case "pm":
      return "우선순위와 사용자 마찰을 빠르게 판단하기 좋은 정리입니다.";
    case "marketing":
      return "CTA와 카피 설득력을 먼저 살펴보는 정리입니다.";
    default:
      return "가장 중요한 수정 포인트부터 바로 행동으로 옮길 수 있게 정리했습니다.";
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildLimitations(debug?: AnalyzeResponse["debug"]) {
  const limitations = [
    "현재 분석은 텍스트와 DOM 근거 중심이라 색 대비, 여백, 정렬 같은 시각 디자인 품질은 제한적으로만 추정합니다.",
    "로그인 이후 화면, 사용자 개인화 영역, 실시간 인터랙션은 이번 리포트 범위에 포함되지 않을 수 있습니다.",
  ];

  if (!debug) {
    return limitations;
  }

  if (debug.source === "fetch") {
    limitations.unshift(
      "이번 결과는 서버에서 바로 읽은 HTML을 기반으로 생성되었습니다. 클라이언트 렌더 후 내용이 크게 달라지는 사이트는 일부 맥락이 누락될 수 있습니다.",
    );
  }

  if (debug.source === "playwright") {
    limitations.unshift(
      "이번 결과는 Playwright로 렌더된 페이지를 다시 읽어 생성되었습니다. 정적 HTML보다 정확하지만, 로그인이나 사용자 이벤트 이후 상태는 여전히 제외될 수 있습니다.",
    );
  }

  if (debug.warnings?.length) {
    return [...debug.warnings, ...limitations];
  }

  return limitations;
}

export function UxCopilot() {
  const [url, setUrl] = useState("vercel.com");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [currentJob, setCurrentJob] = useState<AuditJob | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditReportRecord[]>([]);
  const [comparisonTargetId, setComparisonTargetId] = useState<string | null>(
    null,
  );
  const [debug, setDebug] = useState<AnalyzeResponse["debug"]>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [settings, setSettings] = useState<WorkspaceSettingsResponse | null>(
    null,
  );
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ReportViewMode>("overview");
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const response = await fetchWorkspaceSettings();
      if (cancelled) {
        return;
      }

      setSettings(response);
      setProvider(response.settings.provider);
      setModel(response.settings.model);
    }

    loadSettings().catch(() => {
      if (!cancelled) {
        setSettingsError("워크스페이스 설정을 불러오지 못했습니다.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadingLabel = useMemo(() => {
    if (!isLoading) {
      return null;
    }

    if (currentJob?.stageLabel) {
      return currentJob.stageLabel;
    }

    const seed = url.length % loadingSteps.length;
    return loadingSteps[seed];
  }, [currentJob?.stageLabel, isLoading, url]);

  const limitations = useMemo(() => buildLimitations(debug), [debug]);

  const selectedProviderConfig = useMemo(
    () => settings?.providers.find((item) => item.value === provider),
    [provider, settings],
  );

  const currentHistoryRecord = useMemo(
    () => history.find((item) => item.id === currentReportId) ?? null,
    [currentReportId, history],
  );

  const comparisonTarget = useMemo(
    () => history.find((item) => item.id === comparisonTargetId) ?? null,
    [comparisonTargetId, history],
  );

  const comparison = useMemo(() => {
    if (!currentHistoryRecord || !comparisonTarget) {
      return null;
    }

    return compareAuditReports(
      currentHistoryRecord.report,
      comparisonTarget.report,
    );
  }, [comparisonTarget, currentHistoryRecord]);
  const previewSections = currentJob?.preview?.sections ?? [];
  const previewHighlights = currentJob?.preview?.highlights ?? [];
  const filteredFindings = useMemo(
    () =>
      report?.findings.filter((finding) =>
        matchesViewMode(finding, viewMode),
      ) ?? [],
    [report, viewMode],
  );
  const topFindings = useMemo(
    () =>
      (filteredFindings.length
        ? filteredFindings
        : (report?.findings ?? [])
      ).slice(0, 3),
    [filteredFindings, report],
  );
  const filteredHighlights = useMemo(() => {
    if (!report) {
      return [];
    }

    if (viewMode === "overview") {
      return report.highlights;
    }

    return report.highlights.filter((highlight) =>
      filteredFindings.some(
        (finding) =>
          highlight.includes(finding.category) ||
          highlight.includes(finding.title.slice(0, 6)),
      ),
    );
  }, [filteredFindings, report, viewMode]);

  async function loadHistory(
    targetUrl: string,
    preferredCurrentReportId?: string,
  ) {
    setIsLoadingHistory(true);

    try {
      const response = await fetchAuditReports(targetUrl, 8);
      const reports = response.reports ?? [];
      setHistory(reports);

      const nextCurrentId = preferredCurrentReportId ?? reports[0]?.id ?? null;
      setCurrentReportId(nextCurrentId);
      setComparisonTargetId(
        reports.find((item) => item.id !== nextCurrentId)?.id ?? null,
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    setCurrentJob(null);

    try {
      if (!apiKey.trim()) {
        throw new Error(
          "API key를 입력해 주세요. 키는 저장되지 않고 현재 탭에서만 사용됩니다.",
        );
      }

      const normalizedUrl = normalizeUrl(url);
      const created = await createAuditJobRequest({
        url,
        provider,
        model,
        apiKey: apiKey.trim(),
      });

      if (created.error || !created.job) {
        throw new Error(created.error ?? "분석 작업을 생성하지 못했습니다.");
      }

      setCurrentJob(created.job);
      const processingPromise = runAuditJobRequest(created.job.id, {
        provider,
        model,
        apiKey: apiKey.trim(),
      }).catch(() => null);

      let completedReport: AuditReportRecord | null = null;

      for (let attempt = 0; attempt < 180; attempt += 1) {
        await sleep(1200);
        const snapshot = await fetchAuditJob(created.job.id);

        if (snapshot.job) {
          setCurrentJob(snapshot.job);
        }

        if (snapshot.report) {
          completedReport = snapshot.report;
          break;
        }

        if (snapshot.job?.status === "failed") {
          throw new Error(
            snapshot.job.errorMessage ??
              snapshot.error ??
              "리포트를 생성할 수 없습니다.",
          );
        }
      }

      if (!completedReport) {
        await processingPromise;
        throw new Error(
          "분석 시간이 예상보다 길어지고 있습니다. 잠시 후 다시 확인해 주세요.",
        );
      }

      setReport(completedReport.report);
      setDebug(completedReport.debug);
      setCurrentReportId(completedReport.id);
      await loadHistory(normalizedUrl, completedReport.id);
    } catch (requestError) {
      setReport(null);
      setDebug(undefined);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "리포트를 생성할 수 없습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsError(null);
    setSettingsNotice(null);
    setIsSavingSettings(true);

    try {
      const response = await updateWorkspaceSettings({
        provider,
        model,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSettings(response);
      setSettingsNotice(
        "프로바이더와 모델 설정을 저장했습니다. API key는 저장되지 않습니다.",
      );
    } catch (saveError) {
      setSettingsError(
        saveError instanceof Error
          ? saveError.message
          : "설정을 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  function handleProviderChange(nextProvider: AIProvider) {
    setProvider(nextProvider);
    const nextConfig = settings?.providers.find(
      (item) => item.value === nextProvider,
    );
    setModel(nextConfig?.models[0]?.value ?? "");
  }

  function handleSelectHistory(record: AuditReportRecord) {
    setCurrentReportId(record.id);
    setReport(record.report);
    setDebug(record.debug);
    setViewMode("overview");
    setComparisonTargetId(
      history.find((item) => item.id !== record.id)?.id ?? null,
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.workspaceGrid}>
        <aside className={styles.controlPanel}>
          <section className={`${styles.onboardingCard} ${styles.guideCard}`}>
            <div className={styles.cardHead}>
              <strong>사용법</strong>
              <span>3단계</span>
            </div>
            <div className={styles.onboardingSteps}>
              <article>
                <span>1</span>
                <div>
                  <strong>모델 고르기</strong>
                  <p>`AI 연결 설정`에서 프로바이더와 모델을 먼저 선택합니다.</p>
                </div>
              </article>
              <article>
                <span>2</span>
                <div>
                  <strong>API key 입력</strong>
                  <p>API key는 저장되지 않고 현재 탭에서만 사용됩니다.</p>
                </div>
              </article>
              <article>
                <span>3</span>
                <div>
                  <strong>URL 넣고 실행</strong>
                  <p>
                    `새 리포트 생성`에 분석할 주소를 넣고 바로 실행하면 됩니다.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <form
            className={`${styles.formCard} ${styles.connectionCard}`}
            onSubmit={handleSaveSettings}
          >
            <div className={styles.cardHead}>
              <strong>AI 연결 설정</strong>
              <span>모델 연결</span>
            </div>

            <label className={styles.field}>
              <span>프로바이더</span>
              <select
                className={styles.select}
                value={provider}
                onChange={(event) =>
                  handleProviderChange(event.target.value as AIProvider)
                }
              >
                {(settings?.providers ?? []).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>모델</span>
              <select
                className={styles.select}
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                {(selectedProviderConfig?.models ?? []).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedProviderConfig?.models?.length ? (
              <p className={styles.helper}>
                {
                  selectedProviderConfig.models.find(
                    (item) => item.value === model,
                  )?.description
                }
              </p>
            ) : null}

            <label className={styles.field}>
              <span>API key</span>
              <input
                aria-label="API key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-... 또는 프로바이더 key"
              />
              <small className={styles.securityNote}>
                API key는 저장되지 않으며 현재 탭에서만 유지됩니다.
                <br />
                분석 요청을 보낼 때만 서버로 전달되고, 서비스 데이터에는 남기지
                않습니다.
              </small>
            </label>

            <button
              type="submit"
              disabled={isSavingSettings}
              className={styles.submitButton}
            >
              {isSavingSettings ? "설정 저장 중..." : "연결 설정 저장"}
            </button>

            {/* <div className={styles.settingsMeta}>
              <span>저장된 provider: {settings?.settings.provider ?? "-"}</span>
              <span>저장된 model: {settings?.settings.model ?? "-"}</span>
              <span>API key 저장 방식: 저장하지 않음</span>
            </div> */}

            {settingsNotice ? (
              <p className={styles.notice}>{settingsNotice}</p>
            ) : null}
            {settingsError ? (
              <p className={styles.error}>{settingsError}</p>
            ) : null}
          </form>

          <form
            className={`${styles.formCard} ${styles.runCard}`}
            onSubmit={handleAnalyze}
          >
            <div className={styles.cardHead}>
              <strong>새 리포트 생성</strong>
              <span>리포트 생성</span>
            </div>

            <label className={styles.field}>
              <span>분석할 도메인</span>
              <input
                aria-label="분석할 도메인"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="example.com"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "AI 리포트 생성 중..." : "리포트 생성하기"}
            </button>

            <div className={styles.inlineSamples}>
              <div className={styles.inlineSamplesHead}>
                <strong>빠른 테스트</strong>
                <span>예시 도메인</span>
              </div>
              <div className={styles.samples}>
                {sampleTargets.map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setUrl(target)}
                  >
                    {target}
                  </button>
                ))}
              </div>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}
          </form>

          {/* <section className={`${styles.infoCard} ${styles.agentCard}`}>
            <div className={styles.cardHead}>
              <strong>분석 에이전트</strong>
              <span>에이전트 요약</span>
            </div>
            {debug?.agentTraces?.length ? (
              <div className={styles.agentTraceList}>
                {debug.agentTraces.map((trace) => (
                  <article
                    key={agentLabelMap[trace.agent]}
                    className={styles.agentTraceItem}
                  >
                    <div>
                      <strong>{agentLabelMap[trace.agent]}</strong>
                      <p>{trace.summary}</p>
                    </div>
                    <div className={styles.agentTraceMeta}>
                      <span>{trace.score}</span>
                      <small>{Math.round(trace.confidence * 100)}%</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : currentJob?.agentStates?.length ? (
              <div className={styles.agentTraceList}>
                {currentJob.agentStates.map((trace) => (
                  <article
                    key={agentLabelMap[trace.agent]}
                    className={styles.agentTraceItem}
                  >
                    <div className={styles.agentTraceMain}>
                      <div className={styles.agentTraceHead}>
                        <span
                          className={
                            trace.status === "completed"
                              ? styles.agentStatusDone
                              : trace.status === "running"
                                ? styles.agentStatusRunning
                                : trace.status === "failed"
                                  ? styles.agentStatusFailed
                                  : styles.agentStatusQueued
                          }
                        >
                          {trace.status === "completed"
                            ? "완료"
                            : trace.status === "running"
                              ? "진행"
                              : trace.status === "failed"
                                ? "오류"
                                : "대기"}
                        </span>
                        <strong>{agentLabelMap[trace.agent]}</strong>
                      </div>
                      <p>
                        {trace.summary ??
                          (trace.status === "completed"
                            ? "요약을 정리하는 중입니다."
                            : trace.status === "running"
                              ? "현재 분석을 진행하고 있습니다."
                              : "대기 중입니다.")}
                      </p>
                      <div className={styles.agentProgressTrack}>
                        <span
                          className={styles.agentProgressFill}
                          style={{
                            width: `${getAgentProgressValue(trace.status)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.agentTraceMeta}>
                      <span>
                        {trace.status === "completed"
                          ? (trace.score ?? "-")
                          : trace.status === "running"
                            ? "진행"
                            : "대기"}
                      </span>
                      <small className={styles.agentStatusText}>
                        {getAgentStatusLabel(trace.status)}
                      </small>
                      <small>
                        {trace.confidence
                          ? `${Math.round(trace.confidence * 100)}%`
                          : trace.status === "completed"
                            ? "-"
                            : trace.status === "running"
                              ? "초안 생성 중"
                              : "대기 중"}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.helper}>
                분석을 실행하면 명확성, 접근성, 전환, 모바일, 비주얼 관점의
                요약이 여기에 표시됩니다.
              </p>
            )}
          </section> */}

          <details
            className={`${styles.infoDisclosure} ${styles.evidenceCard}`}
          >
            <summary className={styles.disclosureSummary}>
              <strong>분석 근거와 디버그 정보</strong>
              <span>필요할 때만 펼쳐 보기</span>
            </summary>
            {debug ? (
              <div className={styles.debugEvidence}>
                <div>
                  <strong>페이지 제목</strong>
                  <p>{debug.title ?? "-"}</p>
                </div>
                <div>
                  <strong>페이지 설명</strong>
                  <p>{debug.description ?? "-"}</p>
                </div>
                <div>
                  <strong>헤딩</strong>
                  <div className={styles.evidenceList}>
                    {(debug.headings?.slice(0, 6) ?? []).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>버튼</strong>
                  <div className={styles.evidenceList}>
                    {(debug.buttons?.slice(0, 6) ?? []).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>링크</strong>
                  <div className={styles.evidenceList}>
                    {(debug.links?.slice(0, 6) ?? []).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                {debug.screenshotDataUrl ? (
                  <div>
                    <strong>시각 근거 스크린샷</strong>
                    <img
                      className={styles.screenshotPreview}
                      src={debug.screenshotDataUrl}
                      alt="분석에 사용된 페이지 스크린샷"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className={styles.helper}>
                분석을 실행하면 AI가 참고한 원본 페이지 근거가 여기에
                표시됩니다.
              </p>
            )}
          </details>
        </aside>

        <aside className={styles.floatingSidebar}>
          <section className={`${styles.infoCard} ${styles.historyCard}`}>
            <div className={styles.cardHead}>
              <strong>최근 분석 히스토리</strong>
              <span>저장된 리포트</span>
            </div>
            {isLoadingHistory ? (
              <p className={styles.helper}>히스토리를 불러오는 중입니다.</p>
            ) : history.length ? (
              <div className={styles.historyList}>
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      item.id === currentReportId
                        ? styles.historyItemActive
                        : styles.historyItem
                    }
                    onClick={() => handleSelectHistory(item)}
                  >
                    <strong>{item.report.stance}</strong>
                    <span>{formatCreatedAt(item.createdAt)}</span>
                    <small>{item.targetUrl.replace(/^https?:\/\//, "")}</small>
                    <em>점수 {item.report.score}</em>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.helper}>
                리포트를 한 번 생성하면 최근 분석 내역이 여기에 쌓입니다.
              </p>
            )}
          </section>

          <section className={`${styles.infoCard} ${styles.statusCard}`}>
            <div className={styles.cardHead}>
              <strong>분석 상태</strong>
              <span>수집 품질</span>
            </div>
            <div className={styles.debugCard}>
              <p>수집 방식: {debug?.source ?? "대기 중"}</p>
              <p>
                신호 점수:{" "}
                {debug?.signalScore ?? currentJob?.signalScore ?? "-"}
              </p>
              <p>현재 단계: {currentJob?.stageLabel ?? "대기 중"}</p>
              <p>
                실행 프로바이더:{" "}
                {debug?.provider ?? settings?.settings.provider ?? "-"}
              </p>
              <p>
                실행 모델: {debug?.model ?? settings?.settings.model ?? "-"}
              </p>
              {debug?.warnings?.length ? (
                <ul className={styles.checklist}>
                  {debug.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.helper}>
                  페이지 근거를 충분히 읽어오면 여기에 품질 상태가 표시됩니다.
                </p>
              )}
            </div>
          </section>
        </aside>

        <section className={styles.reportPanel}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingHero}>
                <div className={styles.orbitWrap}>
                  <span className={styles.orbitRing} />
                  <span className={styles.orbitRingDelayed} />
                  <span className={styles.orbitCore} />
                </div>
                <div>
                  <div className={styles.reportLabel}>분석 진행 중</div>
                  <h3>AI가 페이지를 읽고 리포트를 작성하는 중입니다.</h3>
                  <p>{loadingLabel}</p>
                </div>
              </div>

              <div className={styles.loadingStepList}>
                {(currentJob?.agentStates?.length
                  ? currentJob.agentStates.map(
                      (agent) =>
                        `${agentLabelMap[agent.agent]}: ${
                          agent.status === "completed"
                            ? "초안 완료"
                            : agent.status === "running"
                              ? "분석 중"
                              : "대기 중"
                        }`,
                    )
                  : loadingSteps
                ).map((step, index) => (
                  <div key={step} className={styles.loadingStep}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>

              {currentJob?.agentStates?.some(
                (agent) => agent.status === "completed" && agent.summary,
              ) ? (
                <div className={styles.liveAgentPreview}>
                  {currentJob.agentStates
                    .filter(
                      (agent) => agent.status === "completed" && agent.summary,
                    )
                    .map((agent) => (
                      <article
                        key={`preview-${agent.agent}`}
                        className={styles.liveAgentCard}
                      >
                        <div className={styles.liveAgentHead}>
                          <strong>{agentLabelMap[agent.agent]}</strong>
                          <span>부분 결과</span>
                        </div>
                        <p>{agent.summary}</p>
                      </article>
                    ))}
                </div>
              ) : null}

              {currentJob?.preview ? (
                <div className={styles.loadingPreviewCard}>
                  <div className={styles.surfaceMeta}>
                    <span className={styles.previewBadge}>임시 초안</span>
                    <span className={styles.surfaceStage}>
                      {currentJob.stageLabel ?? "최종 리포트를 준비 중입니다."}
                    </span>
                  </div>
                  <div className={styles.reportHeader}>
                    <div>
                      <h3>{currentJob.preview.stance}</h3>
                    </div>
                  </div>
                  <p className={styles.summary}>{currentJob.preview.summary}</p>
                  {previewSections.length ? (
                    <div className={styles.sectionGrid}>
                      {previewSections.map((section) => (
                        <article
                          key={`preview-${section.label}`}
                          className={styles.sectionCard}
                        >
                          <div className={styles.sectionTop}>
                            <strong>{section.label}</strong>
                            <span>{section.score ?? "-"}</span>
                          </div>
                          <p>{section.summary}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                  {previewHighlights.length ? (
                    <div className={styles.highlights}>
                      {previewHighlights.map((highlight) => (
                        <p key={`highlight-${highlight}`}>{highlight}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.loadingSkeletonGrid}>
                <article className={styles.loadingCard}>
                  <span className={styles.shimmerLineShort} />
                  <span className={styles.shimmerLineLong} />
                  <span className={styles.shimmerLineMedium} />
                </article>
                <article className={styles.loadingCard}>
                  <span className={styles.shimmerLineShort} />
                  <span className={styles.shimmerLineMedium} />
                  <span className={styles.shimmerLineLong} />
                </article>
                <article className={styles.loadingCardWide}>
                  <span className={styles.shimmerLineShort} />
                  <span className={styles.shimmerLineLong} />
                  <span className={styles.shimmerLineLong} />
                  <span className={styles.shimmerLineMedium} />
                </article>
              </div>
            </div>
          ) : report ? (
            <div className={`${styles.reportSurface} ${styles.finalSurface}`}>
              <div className={styles.reportHeader}>
                <div>
                  <div className={styles.surfaceMeta}>
                    <span className={styles.reportLabel}>{report.target}</span>
                    <span className={styles.finalBadge}>최종 리포트</span>
                    <span className={styles.benchmarkBadge}>6축 기준</span>
                  </div>
                  <h3>{report.stance}</h3>
                </div>
                <div className={styles.scoreCard}>
                  <span>종합 점수</span>
                  <strong>{report.score}</strong>
                </div>
              </div>

              <section className={styles.actionDeck}>
                <div className={styles.cardHead}>
                  <strong>지금 바로 손볼 3가지</strong>
                  <span>빠른 실행</span>
                </div>
                <p className={styles.helper}>{buildViewHeadline(viewMode)}</p>
                <div className={styles.viewTabs}>
                  <button
                    type="button"
                    className={
                      viewMode === "overview"
                        ? styles.viewTabActive
                        : styles.viewTab
                    }
                    onClick={() => setViewMode("overview")}
                  >
                    전체 보기
                  </button>
                  <button
                    type="button"
                    className={
                      viewMode === "design"
                        ? styles.viewTabActive
                        : styles.viewTab
                    }
                    onClick={() => setViewMode("design")}
                  >
                    디자이너
                  </button>
                  <button
                    type="button"
                    className={
                      viewMode === "pm" ? styles.viewTabActive : styles.viewTab
                    }
                    onClick={() => setViewMode("pm")}
                  >
                    PM
                  </button>
                  <button
                    type="button"
                    className={
                      viewMode === "marketing"
                        ? styles.viewTabActive
                        : styles.viewTab
                    }
                    onClick={() => setViewMode("marketing")}
                  >
                    마케팅
                  </button>
                </div>
                <div className={styles.priorityGrid}>
                  {topFindings.map((finding, index) => (
                    <article
                      key={`${finding.id}-priority`}
                      className={styles.priorityCard}
                    >
                      <div className={styles.priorityTop}>
                        <span className={styles.priorityIndex}>
                          0{index + 1}
                        </span>
                        <span className={severityClassMap[finding.severity]}>
                          {finding.severity}
                        </span>
                      </div>
                      <span className={styles.axisBadge}>{finding.axis}</span>
                      <strong>{finding.title}</strong>
                      <p>{finding.action}</p>
                    </article>
                  ))}
                </div>
              </section>

              <p className={styles.summary}>{report.summary}</p>

              <div className={styles.sectionGrid}>
                {report.sections.map((section) => (
                  <article key={section.label} className={styles.sectionCard}>
                    <div className={styles.sectionTop}>
                      <strong>{section.label}</strong>
                      <span>{section.score}</span>
                    </div>
                    <p>{section.summary}</p>
                  </article>
                ))}
              </div>

              {comparison && comparisonTarget ? (
                <section className={styles.comparisonCard}>
                  <div className={styles.cardHead}>
                    <strong>비교 리포트</strong>
                    <span>직전 분석과 비교</span>
                  </div>
                  <div className={styles.comparisonToolbar}>
                    <p>
                      비교 기준:{" "}
                      <strong>
                        {formatCreatedAt(comparisonTarget.createdAt)}
                      </strong>
                    </p>
                    <select
                      className={styles.select}
                      value={comparisonTargetId ?? ""}
                      onChange={(event) =>
                        setComparisonTargetId(event.target.value || null)
                      }
                    >
                      {history
                        .filter((item) => item.id !== currentReportId)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {formatCreatedAt(item.createdAt)} · 점수{" "}
                            {item.report.score}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className={styles.comparisonStats}>
                    <article>
                      <span>점수 변화</span>
                      <strong
                        className={
                          comparison.scoreDelta >= 0
                            ? styles.deltaPositive
                            : styles.deltaNegative
                        }
                      >
                        {comparison.scoreDelta >= 0 ? "+" : ""}
                        {comparison.scoreDelta}
                      </strong>
                    </article>
                    <article>
                      <span>개선된 섹션</span>
                      <strong>{comparison.improvedCount}</strong>
                    </article>
                    <article>
                      <span>하락한 섹션</span>
                      <strong>{comparison.regressedCount}</strong>
                    </article>
                  </div>
                  <div className={styles.comparisonGrid}>
                    <div className={styles.comparisonBlock}>
                      <strong>새로 보이는 이슈</strong>
                      {comparison.addedFindings.length ? (
                        <ul className={styles.checklist}>
                          {comparison.addedFindings.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.helper}>
                          새롭게 추가된 핵심 이슈는 없습니다.
                        </p>
                      )}
                    </div>
                    <div className={styles.comparisonBlock}>
                      <strong>사라진 이슈</strong>
                      {comparison.resolvedFindings.length ? (
                        <ul className={styles.checklist}>
                          {comparison.resolvedFindings.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.helper}>
                          해결된 것으로 보이는 핵심 이슈는 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.comparisonSectionList}>
                    {comparison.sectionChanges.map((item) => (
                      <article
                        key={item.label}
                        className={styles.comparisonSectionItem}
                      >
                        <strong>{item.label}</strong>
                        <span>
                          {item.previousScore} → {item.currentScore}
                        </span>
                        <em
                          className={
                            item.delta >= 0
                              ? styles.deltaPositive
                              : styles.deltaNegative
                          }
                        >
                          {item.delta >= 0 ? "+" : ""}
                          {item.delta}
                        </em>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className={styles.findingsHeader}>
                <strong>핵심 이슈</strong>
                <span>
                  {
                    (filteredFindings.length
                      ? filteredFindings
                      : report.findings
                    ).length
                  }
                  개의 우선 개선 포인트
                </span>
              </div>
              <div className={styles.findings}>
                {(filteredFindings.length
                  ? filteredFindings
                  : report.findings
                ).map((finding) => (
                  <article key={finding.id} className={styles.finding}>
                    <div className={styles.findingTop}>
                      <span className={severityClassMap[finding.severity]}>
                        {finding.severity}
                      </span>
                      <span className={styles.category}>
                        {finding.category}
                      </span>
                      <span className={styles.axisBadge}>{finding.axis}</span>
                    </div>
                    <h4>{finding.title}</h4>
                    <p>{finding.rationale}</p>
                    {finding.evidence?.length ? (
                      <div className={styles.evidenceList}>
                        {finding.evidence.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                    ) : null}
                    <strong>권장 수정안</strong>
                    <p>{finding.action}</p>
                  </article>
                ))}
              </div>

              <div className={styles.highlights}>
                {(filteredHighlights.length
                  ? filteredHighlights
                  : report.highlights
                ).map((highlight) => (
                  <p key={highlight}>{highlight}</p>
                ))}
              </div>

              <section className={styles.limitationsCard}>
                <div className={styles.cardHead}>
                  <strong>분석 한계</strong>
                  <span>확인 필요 사항</span>
                </div>
                <ul className={styles.limitationsList}>
                  {limitations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyHero}>
                <div className={styles.emptyCopy}>
                  <div className={styles.emptyEyebrow}>
                    <span className={styles.emptyPulse} />
                    분석 준비 완료
                  </div>
                  <h3>
                    설정을 마치면 이 공간이 AI UX 리포트 캔버스로 바뀝니다
                  </h3>
                  <p>
                    점수, 우선 수정안, 비교 리포트, 근거 요약까지 한 번에 읽히는
                    메인 보드입니다.
                    <br />첫 분석을 실행하면 이 영역이 결과 중심 화면으로 바로
                    전환됩니다.
                  </p>

                  <div className={styles.emptySignals}>
                    <article>
                      <strong>실시간 진행</strong>
                      <span>수집부터 종합까지 단계별로 표시</span>
                    </article>
                    <article>
                      <strong>행동 중심 결과</strong>
                      <span>지금 손볼 3가지부터 먼저 제안</span>
                    </article>
                    <article>
                      <strong>근거 확인</strong>
                      <span>필요할 때만 evidence와 디버그 펼쳐 보기</span>
                    </article>
                  </div>
                </div>

                <div className={styles.emptyVisual}>
                  <div className={styles.emptyOrbPrimary} />
                  <div className={styles.emptyOrbSecondary} />
                  <div className={styles.emptyMockWindow}>
                    <div className={styles.emptyMockTop}>
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className={styles.emptyMockBody}>
                      <article className={styles.emptyMockCardLarge}>
                        <small>AI PREVIEW</small>
                        <strong>
                          리포트가 생성되면 요약이 먼저 도착합니다
                        </strong>
                        <div className={styles.emptyChart}>
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                      </article>
                      <div className={styles.emptyMockRow}>
                        <article className={styles.emptyMockCard}>
                          <small>CLARITY</small>
                          <strong>82</strong>
                        </article>
                        <article className={styles.emptyMockCard}>
                          <small>CONVERSION</small>
                          <strong>74</strong>
                        </article>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.placeholderGrid}>
                <article>
                  <strong>익숙한 모델 연결</strong>
                  <span>
                    지금 사용 중인 모델을 연결해 바로 분석을 시작할 수 있습니다.
                  </span>
                </article>
                <article>
                  <strong>근거 확인</strong>
                  <span>
                    핵심 이슈마다 실제 페이지 근거 문자열을 함께 확인할 수
                    있습니다.
                  </span>
                </article>
                <article>
                  <strong>확장 가능한 흐름</strong>
                  <span>
                    분석 결과를 반복해서 확인하고 다음 단계 기능으로 확장하기
                    좋은 구조입니다.
                  </span>
                </article>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
