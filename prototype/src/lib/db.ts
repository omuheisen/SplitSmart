import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as typeof globalThis & { prisma?: PrismaClient };

export const prisma = globalDatabase.prisma ?? new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL ?? "file:./splitsmart.db",
});

if (process.env.NODE_ENV !== "production") globalDatabase.prisma = prisma;
