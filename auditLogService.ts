import { prisma } from '../config/db';

export interface AuditLogEntry {
  actorId: string;
  actorRole: string;
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

export async function appendAuditLog(
  agreementId: string,
  actorId: string,
  actorRole: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: { auditLog: true },
  });

  if (!agreement) return;

  const currentLog = (Array.isArray(agreement.auditLog) ? agreement.auditLog : []) as unknown as AuditLogEntry[];

  const newEntry: AuditLogEntry = {
    actorId,
    actorRole,
    action,
    timestamp: new Date().toISOString(),
    details: details || {},
  };

  await prisma.agreement.update({
    where: { id: agreementId },
    data: {
      auditLog: [...currentLog, newEntry] as any,
    },
  });
}
