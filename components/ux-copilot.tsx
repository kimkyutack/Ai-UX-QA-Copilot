"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  requestAuditReport,
  type AnalyzeResponse,
} from "@/services/api/analyze";
import {
  fetchWorkspaceSettings,
  updateWorkspaceSettings,
} from "@/services/api/settings";
import type { AuditReport, Severity } from "@/types/audit";
import type { WorkspaceSettingsResponse } from "@/types/api/settings";
import type { AIProvider } from "@/types/domain/ai-settings";
import styles from "./ux-copilot.module.css";

const sampleTargets = ["stripe.com", "notion.so", "vercel.com", "linear.app"];
const loadingSteps = [
  "페이지 기본 HTML을 수집하고 있습니다",
  "필요하면 브라우저 렌더링으로 본문을 다시 읽고 있습니다",
  "전문 에이전트가 명확성, 전환, 접근성, 모바일 관점으로 분석을 병렬로 수행하고 있습니다",
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
} as const;

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
  const [debug, setDebug] = useState<AnalyzeResponse["debug"]>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState<WorkspaceSettingsResponse | null>(
    null,
  );
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
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

    const seed = url.length % loadingSteps.length;
    return loadingSteps[seed];
  }, [isLoading, url]);

  const limitations = useMemo(() => buildLimitations(debug), [debug]);

  const selectedProviderConfig = useMemo(
    () => settings?.providers.find((item) => item.value === provider),
    [provider, settings],
  );

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!apiKey.trim()) {
        throw new Error("API key를 입력해 주세요. 키는 저장되지 않고 현재 탭에서만 사용됩니다.");
      }

      const data = await requestAuditReport(url, {
        provider,
        model,
        apiKey: apiKey.trim(),
      });
      setReport(data.report ?? null);
      setDebug(data.debug);
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
      setSettingsNotice("프로바이더와 모델 설정을 저장했습니다. API key는 저장되지 않습니다.");
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

  return (
    <div className={styles.wrapper}>
      <section className={styles.workspaceHeader}>
        <div>
          <span className={styles.kicker}>Workspace</span>
          <h2>페이지를 빠르게 진단하고 정리하는 AI UX QA 워크스페이스</h2>
          <p>
            분석에 사용할 모델과 key를 연결한 뒤 바로 리포트를 생성할 수
            있습니다.
            <br />
            수집 상태, 원본 근거, 에이전트별 판단, 최종 요약이 한 흐름 안에서
            이어지도록 구성했습니다.
          </p>
        </div>
        <div className={styles.headerMeta}>
          <div>
            <strong>연결 방식</strong>
            <span>개인 API key를 연결해 바로 실행</span>
          </div>
          <div>
            <strong>분석 방식</strong>
            <span>여러 에이전트가 역할을 나눠 리포트를 정리</span>
          </div>
        </div>
      </section>

      <div className={styles.workspaceGrid}>
        <aside className={styles.controlPanel}>
          <form className={styles.formCard} onSubmit={handleSaveSettings}>
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
                placeholder={
                  "sk-... 또는 provider key"
                }
              />
              <small className={styles.securityNote}>
                API key는 저장되지 않으며 현재 탭에서만 유지됩니다. 분석 요청을 보낼 때만 서버로 전달되고, 서비스 데이터에는 남기지 않습니다.
              </small>
            </label>

            <button
              type="submit"
              disabled={isSavingSettings}
              className={styles.submitButton}
            >
              {isSavingSettings ? "설정 저장 중..." : "연결 설정 저장"}
            </button>

            <div className={styles.settingsMeta}>
              <span>저장된 provider: {settings?.settings.provider ?? "-"}</span>
              <span>저장된 model: {settings?.settings.model ?? "-"}</span>
              <span>API key 저장 방식: 저장하지 않음</span>
            </div>

            {settingsNotice ? (
              <p className={styles.notice}>{settingsNotice}</p>
            ) : null}
            {settingsError ? (
              <p className={styles.error}>{settingsError}</p>
            ) : null}
          </form>

          <form className={styles.formCard} onSubmit={handleAnalyze}>
            <div className={styles.cardHead}>
              <strong>새 리포트 생성</strong>
              <span>리포트 생성</span>
            </div>

            <label className={styles.field}>
              <span>분석할 URL</span>
              <input
                aria-label="분석할 URL"
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

            {error ? <p className={styles.error}>{error}</p> : null}
          </form>

          <section className={styles.infoCard}>
            <div className={styles.cardHead}>
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
          </section>

          <section className={styles.infoCard}>
            <div className={styles.cardHead}>
              <strong>분석 상태</strong>
              <span>수집 품질</span>
            </div>
            <div className={styles.debugCard}>
              <p>수집 방식: {debug?.source ?? "대기 중"}</p>
              <p>신호 점수: {debug?.signalScore ?? "-"}</p>
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

          <section className={styles.infoCard}>
            <div className={styles.cardHead}>
              <strong>분석 에이전트</strong>
              <span>에이전트 요약</span>
            </div>
            {debug?.agentTraces?.length ? (
              <div className={styles.agentTraceList}>
                {debug.agentTraces.map((trace) => (
                  <article key={agentLabelMap[trace.agent]} className={styles.agentTraceItem}>
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
            ) : (
              <p className={styles.helper}>
                분석을 실행하면 명확성, 접근성, 전환, 모바일 관점의 요약이
                여기에 표시됩니다.
              </p>
            )}
          </section>

          <section className={styles.infoCard}>
            <div className={styles.cardHead}>
              <strong>분석에 사용된 페이지 근거</strong>
              <span>페이지 근거</span>
            </div>
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
              </div>
            ) : (
              <p className={styles.helper}>
                분석을 실행하면 AI가 참고한 원본 페이지 근거가 여기에
                표시됩니다.
              </p>
            )}
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
                {loadingSteps.map((step, index) => (
                  <div key={step} className={styles.loadingStep}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>

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
            <>
              <div className={styles.reportHeader}>
                <div>
                  <span className={styles.reportLabel}>{report.target}</span>
                  <h3>{report.stance}</h3>
                </div>
                <div className={styles.scoreCard}>
                  <span>종합 점수</span>
                  <strong>{report.score}</strong>
                </div>
              </div>

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

              <div className={styles.findingsHeader}>
                <strong>핵심 이슈</strong>
                <span>{report.findings.length}개의 우선 개선 포인트</span>
              </div>
              <div className={styles.findings}>
                {report.findings.map((finding) => (
                  <article key={finding.id} className={styles.finding}>
                    <div className={styles.findingTop}>
                      <span className={severityClassMap[finding.severity]}>
                        {finding.severity}
                      </span>
                      <span className={styles.category}>
                        {finding.category}
                      </span>
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
                {report.highlights.map((highlight) => (
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
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.reportLabel}>분석 준비 완료</div>
              <h3>설정을 마친 후 바로 리포트를 생성할 수 있습니다</h3>
              <p>
                페이지를 읽고 문제를 정리하는 흐름, 원본 근거 확인, 단계별
                해석까지 한 화면에서 이어서 경험할 수 있도록 설계했습니다.
              </p>

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
