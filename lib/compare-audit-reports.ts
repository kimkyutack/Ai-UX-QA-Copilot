import type { AuditReport } from "@/types/audit";
import type { ReportComparisonSummary } from "@/types/domain/report-comparison";

export function compareAuditReports(current: AuditReport, previous: AuditReport): ReportComparisonSummary {
  const previousTitles = new Set(previous.findings.map((finding) => finding.title.trim().toLowerCase()));
  const currentTitles = new Set(current.findings.map((finding) => finding.title.trim().toLowerCase()));

  const addedFindings = current.findings
    .filter((finding) => !previousTitles.has(finding.title.trim().toLowerCase()))
    .map((finding) => finding.title)
    .slice(0, 4);

  const resolvedFindings = previous.findings
    .filter((finding) => !currentTitles.has(finding.title.trim().toLowerCase()))
    .map((finding) => finding.title)
    .slice(0, 4);

  const previousSections = new Map(previous.sections.map((section) => [section.label, section]));
  const sectionChanges = current.sections.map((section) => {
    const previousSection = previousSections.get(section.label);
    const previousScore = previousSection?.score ?? 0;

    return {
      label: section.label,
      currentScore: section.score,
      previousScore,
      delta: section.score - previousScore,
    };
  });

  return {
    currentScore: current.score,
    previousScore: previous.score,
    scoreDelta: current.score - previous.score,
    improvedCount: sectionChanges.filter((section) => section.delta > 0).length,
    regressedCount: sectionChanges.filter((section) => section.delta < 0).length,
    addedFindings,
    resolvedFindings,
    sectionChanges,
  };
}
