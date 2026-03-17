export type ReportComparisonSection = {
  label: string;
  currentScore: number;
  previousScore: number;
  delta: number;
};

export type ReportComparisonSummary = {
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  improvedCount: number;
  regressedCount: number;
  addedFindings: string[];
  resolvedFindings: string[];
  sectionChanges: ReportComparisonSection[];
};
