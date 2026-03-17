import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPrismaClient } from "@/services/repositories/prisma-client";
import type {
  AuditJob,
  AuditJobAgentState,
  AuditJobPreview,
  AuditJobStage,
  AuditJobStatus,
} from "@/types/domain/audit-job";
import type { AuditReportRecord } from "@/types/domain/audit-report-record";

const dataDir = path.join(process.cwd(), ".data");
const jobsFile = path.join(dataDir, "audit-jobs.json");
const reportsFile = path.join(dataDir, "audit-reports.json");

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await ensureStore();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function normalizeAgentStates(value: unknown): AuditJobAgentState[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is AuditJobAgentState => {
    return Boolean(
      item &&
        typeof item === "object" &&
        "agent" in item &&
        "status" in item,
    );
  });
}

function normalizePreview(value: unknown): AuditJobPreview | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as AuditJobPreview;
  if (
    typeof candidate.stance !== "string" ||
    typeof candidate.summary !== "string" ||
    !Array.isArray(candidate.highlights) ||
    !Array.isArray(candidate.sections)
  ) {
    return undefined;
  }

  return candidate;
}

function mapStoredJob(job: {
  id: string;
  projectId: string | null;
  targetUrl: string;
  status: string;
  stage: string | null;
  stageLabel: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  report?: { id: string } | null;
  errorMessage: string | null;
  signalScore: number | null;
  source: string | null;
  agentStatesJson: unknown;
  reportPreviewJson: unknown;
}): AuditJob {
  return {
    id: job.id,
    projectId: job.projectId ?? "demo-project",
    targetUrl: job.targetUrl,
    status: job.status as AuditJobStatus,
    stage: (job.stage ?? job.status ?? "queued") as AuditJobStage,
    stageLabel: job.stageLabel ?? undefined,
    createdAt:
      typeof job.createdAt === "string"
        ? job.createdAt
        : job.createdAt.toISOString(),
    updatedAt:
      typeof job.updatedAt === "string"
        ? job.updatedAt
        : job.updatedAt.toISOString(),
    reportId: job.report?.id ?? undefined,
    errorMessage: job.errorMessage ?? undefined,
    signalScore: job.signalScore ?? undefined,
    source:
      job.source === "fetch" || job.source === "playwright"
        ? job.source
        : undefined,
    agentStates: normalizeAgentStates(job.agentStatesJson),
    preview: normalizePreview(job.reportPreviewJson),
  };
}

function mapStoredReport(report: {
  id: string;
  jobId: string;
  projectId: string | null;
  targetUrl: string;
  createdAt: Date | string;
  summaryJson: unknown;
  debugJson: unknown;
}): AuditReportRecord {
  return {
    id: report.id,
    jobId: report.jobId,
    projectId: report.projectId ?? "demo-project",
    targetUrl: report.targetUrl,
    createdAt:
      typeof report.createdAt === "string"
        ? report.createdAt
        : report.createdAt.toISOString(),
    report: report.summaryJson as AuditReportRecord["report"],
    debug: report.debugJson as AuditReportRecord["debug"],
  };
}

async function listAuditJobsFromFile() {
  const jobs = await readJsonFile<AuditJob[]>(jobsFile, []);
  return jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function listAuditReportsFromFile() {
  const reports = await readJsonFile<AuditReportRecord[]>(reportsFile, []);
  return reports.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listAuditJobs() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return listAuditJobsFromFile();
  }

  const jobs = await prisma.auditJob.findMany({
    orderBy: { createdAt: "desc" },
    include: { report: { select: { id: true } } },
  });

  return jobs.map(mapStoredJob);
}

export async function createAuditJob(job: AuditJob) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const jobs = await listAuditJobsFromFile();
    const nextJobs = [job, ...jobs];
    await writeJsonFile(jobsFile, nextJobs);
    return job;
  }

  await prisma.auditJob.create({
    data: {
      id: job.id,
      projectId: job.projectId,
      targetUrl: job.targetUrl,
      status: job.status,
      stage: job.stage,
      stageLabel: job.stageLabel,
      errorMessage: job.errorMessage,
      signalScore: job.signalScore,
      source: job.source,
      agentStatesJson: job.agentStates ?? [],
      reportPreviewJson: job.preview,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
    },
  });

  return job;
}

export async function updateAuditJob(
  jobId: string,
  updater: (job: AuditJob) => AuditJob,
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const jobs = await listAuditJobsFromFile();
    const nextJobs = jobs.map((job) => (job.id === jobId ? updater(job) : job));
    await writeJsonFile(jobsFile, nextJobs);
    return nextJobs.find((job) => job.id === jobId);
  }

  const current = await prisma.auditJob.findUnique({
    where: { id: jobId },
    include: { report: { select: { id: true } } },
  });

  if (!current) {
    return undefined;
  }

  const nextJob = updater(mapStoredJob(current));

  await prisma.auditJob.update({
    where: { id: jobId },
    data: {
      projectId: nextJob.projectId,
      targetUrl: nextJob.targetUrl,
      status: nextJob.status,
      stage: nextJob.stage,
      stageLabel: nextJob.stageLabel,
      errorMessage: nextJob.errorMessage,
      signalScore: nextJob.signalScore,
      source: nextJob.source,
      agentStatesJson: nextJob.agentStates ?? [],
      reportPreviewJson: nextJob.preview,
      updatedAt: new Date(nextJob.updatedAt),
    },
  });

  return nextJob;
}

export async function getAuditJob(jobId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const jobs = await listAuditJobsFromFile();
    return jobs.find((job) => job.id === jobId);
  }

  const job = await prisma.auditJob.findUnique({
    where: { id: jobId },
    include: { report: { select: { id: true } } },
  });

  return job ? mapStoredJob(job) : undefined;
}

export async function listAuditReports() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return listAuditReportsFromFile();
  }

  const reports = await prisma.auditReport.findMany({
    orderBy: { createdAt: "desc" },
  });

  return reports.map(mapStoredReport);
}

export async function listAuditReportsByTargetUrl(targetUrl: string, limit = 10) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const reports = await listAuditReportsFromFile();
    return reports.filter((report) => report.targetUrl === targetUrl).slice(0, limit);
  }

  const reports = await prisma.auditReport.findMany({
    where: { targetUrl },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return reports.map(mapStoredReport);
}

export async function saveAuditReport(report: AuditReportRecord) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const reports = await listAuditReportsFromFile();
    const nextReports = [report, ...reports];
    await writeJsonFile(reportsFile, nextReports);
    return report;
  }

  await prisma.auditReport.create({
    data: {
      id: report.id,
      jobId: report.jobId,
      projectId: report.projectId,
      targetUrl: report.targetUrl,
      summaryJson: report.report,
      debugJson: report.debug,
      createdAt: new Date(report.createdAt),
    },
  });

  return report;
}

export async function getAuditReport(reportId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const reports = await listAuditReportsFromFile();
    return reports.find((report) => report.id === reportId);
  }

  const report = await prisma.auditReport.findUnique({
    where: { id: reportId },
  });

  return report ? mapStoredReport(report) : undefined;
}

export async function getAuditReportByJobId(jobId: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    const reports = await listAuditReportsFromFile();
    return reports.find((report) => report.jobId === jobId);
  }

  const report = await prisma.auditReport.findUnique({
    where: { jobId },
  });

  return report ? mapStoredReport(report) : undefined;
}
