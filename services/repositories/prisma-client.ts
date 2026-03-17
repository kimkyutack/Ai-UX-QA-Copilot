import { PrismaClient } from "@prisma/client";

declare global {
  var __uxQaPrisma: PrismaClient | undefined;
}

export function isPrismaConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient() {
  if (!isPrismaConfigured()) {
    return null;
  }

  if (!globalThis.__uxQaPrisma) {
    globalThis.__uxQaPrisma = new PrismaClient();
  }

  return globalThis.__uxQaPrisma;
}
