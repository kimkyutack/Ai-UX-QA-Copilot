export type ReportComparisonSection = {
  label: string;
  currentScore: number;
  previousScore: number;
  delta: number;
};

export type ReportComparisonStatus = {
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
};

export type ReportComparisonFindingDelta = {
  id: string;
  title: string;
  category: string;
  severity: string;
  axis: string;
};

export type ReportComparisonSummary = {
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  improvedCount: number;
  regressedCount: number;
  unchangedCount: number;
  addedFindings: ReportComparisonFindingDelta[];
  resolvedFindings: ReportComparisonFindingDelta[];
  sectionChanges: ReportComparisonSection[];
  currentStatus: ReportComparisonStatus;
  previousStatus: ReportComparisonStatus;
  statusDelta: ReportComparisonStatus;
};
