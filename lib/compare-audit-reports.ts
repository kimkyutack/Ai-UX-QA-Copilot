import type { AuditReportRecord } from "@/types/domain/audit-report-record";
import type { ReportComparisonSummary } from "@/types/domain/report-comparison";

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

function buildStatusCounts(record: AuditReportRecord) {
  const statusMap = new Map(
    (record.collaboration?.findingStates ?? []).map((item) => [item.findingId, item.status]),
  );

  return record.report.findings.reduce(
    (counts, finding) => {
      const status = statusMap.get(finding.id) ?? "open";

      if (status === "resolved") {
        counts.resolvedCount += 1;
      } else if (status === "in_progress") {
        counts.inProgressCount += 1;
      } else {
        counts.openCount += 1;
      }

      return counts;
    },
    { openCount: 0, inProgressCount: 0, resolvedCount: 0 },
  );
}

export function compareAuditReports(
  current: AuditReportRecord,
  previous: AuditReportRecord,
): ReportComparisonSummary {
  const previousTitles = new Set(previous.report.findings.map((finding) => normalizeTitle(finding.title)));
  const currentTitles = new Set(current.report.findings.map((finding) => normalizeTitle(finding.title)));

  const addedFindings = current.report.findings
    .filter((finding) => !previousTitles.has(normalizeTitle(finding.title)))
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      axis: finding.axis,
    }))
    .slice(0, 4);

  const resolvedFindings = previous.report.findings
    .filter((finding) => !currentTitles.has(normalizeTitle(finding.title)))
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      axis: finding.axis,
    }))
    .slice(0, 4);

  const previousSections = new Map(previous.report.sections.map((section) => [section.label, section]));
  const sectionChanges = current.report.sections.map((section) => {
    const previousSection = previousSections.get(section.label);
    const previousScore = previousSection?.score ?? 0;

    return {
      label: section.label,
      currentScore: section.score,
      previousScore,
      delta: section.score - previousScore,
    };
  });

  const currentStatus = buildStatusCounts(current);
  const previousStatus = buildStatusCounts(previous);

  return {
    currentScore: current.report.score,
    previousScore: previous.report.score,
    scoreDelta: current.report.score - previous.report.score,
    improvedCount: sectionChanges.filter((section) => section.delta > 0).length,
    regressedCount: sectionChanges.filter((section) => section.delta < 0).length,
    unchangedCount: sectionChanges.filter((section) => section.delta === 0).length,
    addedFindings,
    resolvedFindings,
    sectionChanges,
    currentStatus,
    previousStatus,
    statusDelta: {
      openCount: currentStatus.openCount - previousStatus.openCount,
      inProgressCount: currentStatus.inProgressCount - previousStatus.inProgressCount,
      resolvedCount: currentStatus.resolvedCount - previousStatus.resolvedCount,
    },
  };
}
