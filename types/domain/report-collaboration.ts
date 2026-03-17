export type FindingStatus = "open" | "in_progress" | "resolved";

export type FindingCollaboration = {
  findingId: string;
  status: FindingStatus;
  assignee?: string;
  note?: string;
  updatedAt: string;
};

export type ReportCollaboration = {
  findingStates: FindingCollaboration[];
};
