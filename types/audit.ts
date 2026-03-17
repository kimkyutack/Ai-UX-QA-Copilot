export type Severity = "치명" | "높음" | "보통" | "낮음";
export type AuditCategory = "접근성" | "콘텐츠" | "전환" | "모바일" | "일관성";
export type AuditAxis =
  | "명확성"
  | "행동 유도"
  | "정보 계층"
  | "밀도와 여백"
  | "상태 표현"
  | "일관성";

export type AuditFinding = {
  id: string;
  title: string;
  axis: AuditAxis;
  severity: Severity;
  category: AuditCategory;
  rationale: string;
  action: string;
  evidence?: string[];
};

export type AuditSection = {
  label: string;
  score: number;
  summary: string;
};

export type AuditReport = {
  target: string;
  score: number;
  stance: string;
  summary: string;
  sections: AuditSection[];
  findings: AuditFinding[];
  highlights: string[];
};
