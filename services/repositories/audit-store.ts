import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditJob } from "@/types/domain/audit-job";
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

export async function listAuditJobs() {
  const jobs = await readJsonFile<AuditJob[]>(jobsFile, []);
  return jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createAuditJob(job: AuditJob) {
  const jobs = await listAuditJobs();
  const nextJobs = [job, ...jobs];
  await writeJsonFile(jobsFile, nextJobs);
  return job;
}

export async function updateAuditJob(jobId: string, updater: (job: AuditJob) => AuditJob) {
  const jobs = await listAuditJobs();
  const nextJobs = jobs.map((job) => (job.id === jobId ? updater(job) : job));
  await writeJsonFile(jobsFile, nextJobs);
  return nextJobs.find((job) => job.id === jobId);
}

export async function getAuditJob(jobId: string) {
  const jobs = await listAuditJobs();
  return jobs.find((job) => job.id === jobId);
}

export async function listAuditReports() {
  const reports = await readJsonFile<AuditReportRecord[]>(reportsFile, []);
  return reports.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveAuditReport(report: AuditReportRecord) {
  const reports = await listAuditReports();
  const nextReports = [report, ...reports];
  await writeJsonFile(reportsFile, nextReports);
  return report;
}

export async function getAuditReport(reportId: string) {
  const reports = await listAuditReports();
  return reports.find((report) => report.id === reportId);
}

export async function getAuditReportByJobId(jobId: string) {
  const reports = await listAuditReports();
  return reports.find((report) => report.jobId === jobId);
}
