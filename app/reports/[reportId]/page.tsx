import Link from "next/link";
import { notFound } from "next/navigation";
import { generateImprovementDrafts } from "@/lib/generate-improvement-drafts";
import { getAuditReport } from "@/services/repositories/audit-store";
import { analysisModeOptions } from "@/types/domain/analysis-mode";
import { ReportShareActions } from "@/components/report-share-actions";
import styles from "./report-page.module.css";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const record = await getAuditReport(reportId);

  if (!record) {
    notFound();
  }

  const analysisMode = record.debug.analysisMode ?? "saas";
  const improvementDrafts = generateImprovementDrafts(analysisMode, record.report);
  const statusMap = new Map(
    (record.collaboration?.findingStates ?? []).map((item) => [item.findingId, item]),
  );
  const modeLabel =
    analysisModeOptions.find((option) => option.value === analysisMode)?.label ??
    "기본 분석";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.brand}>Audit Flow AI</p>
            <span className={styles.brandMeta}>공유 리포트</span>
          </div>
          <div className={styles.topbarActions}>
            <Link href="/workspace">워크스페이스로 돌아가기</Link>
            <ReportShareActions reportId={reportId} showPrint />
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroMeta}>
            <span className={styles.targetBadge}>{record.report.target}</span>
            <span className={styles.modeBadge}>{modeLabel}</span>
            <span className={styles.timestamp}>
              {new Intl.DateTimeFormat("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(record.createdAt))}
            </span>
          </div>
          <div className={styles.heroHead}>
            <div>
              <h1>{record.report.stance}</h1>
              <p>{record.report.summary}</p>
            </div>
            <div className={styles.scoreCard}>
              <span>종합 점수</span>
              <strong>{record.report.score}</strong>
            </div>
          </div>
        </section>

        <section className={styles.sectionGrid}>
          {record.report.sections.map((section) => (
            <article key={section.label} className={styles.sectionCard}>
              <div className={styles.sectionTop}>
                <strong>{section.label}</strong>
                <span>{section.score}</span>
              </div>
              <p>{section.summary}</p>
            </article>
          ))}
        </section>

        <section className={styles.improvementDeck}>
          <div className={styles.deckHead}>
            <strong>바로 적용해볼 실행 초안</strong>
            <span>{modeLabel}</span>
          </div>
          <div className={styles.improvementGrid}>
            {improvementDrafts.map((draft) => (
              <article key={draft.id} className={styles.improvementCard}>
                <span className={styles.eyebrow}>{draft.eyebrow}</span>
                <strong>{draft.title}</strong>
                <p>{draft.summary}</p>
                <ul>
                  {draft.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <small>{draft.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.findingSection}>
          <div className={styles.deckHead}>
            <strong>핵심 이슈와 실행 상태</strong>
            <span>{record.report.findings.length}개 항목</span>
          </div>
          <div className={styles.findingList}>
            {record.report.findings.map((finding) => {
              const state = statusMap.get(finding.id);

              return (
                <article key={finding.id} className={styles.findingCard}>
                  <div className={styles.findingMeta}>
                    <span className={styles.severity}>{finding.severity}</span>
                    <span className={styles.category}>{finding.category}</span>
                    <span className={styles.axis}>{finding.axis}</span>
                    {state ? <span className={styles.status}>{state.status}</span> : null}
                    {state?.assignee ? (
                      <span className={styles.assignee}>담당 {state.assignee}</span>
                    ) : null}
                  </div>
                  <h2>{finding.title}</h2>
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
                  {state?.note ? (
                    <div className={styles.noteBox}>
                      <strong>팀 메모</strong>
                      <p>{state.note}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.footerMeta}>
          <article>
            <strong>수집 방식</strong>
            <p>{record.debug.source}</p>
          </article>
          <article>
            <strong>신호 점수</strong>
            <p>{record.debug.signalScore}</p>
          </article>
          <article>
            <strong>실행 모델</strong>
            <p>{record.debug.model ?? "-"}</p>
          </article>
        </section>
      </div>
    </main>
  );
}
