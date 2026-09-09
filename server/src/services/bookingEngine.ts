import { prisma } from '../config/db';
import { acquireLock, releaseLock } from '../utils/redis';
import { compileContractClauses, CompiledContractSnapshot } from './contractEngine';
import { appendAuditLog } from './auditLogService';

export interface CreateBookingParams {
  itemId: string;
  renterId: string;
  templateId?: string;
  startDate: string;
  endDate: string;
}

export class ConcurrencyConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export async function createBookingConcurrentlySafe(params: CreateBookingParams) {
  const { itemId, renterId, templateId, startDate, endDate } = params;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end date');
  }

  if (end <= start) {
    throw new Error('End date must be after start date');
  }

  // 1. Distributed Redis / Mutex Lock per Item ID
  const lockKey = `lock:item-booking:${itemId}`;
  const acquired = await acquireLock(lockKey, 6000);

  if (!acquired) {
    throw new ConcurrencyConflictError('Item booking is currently locked by another concurrent request. Please retry.');
  }

  try {
    // 2. Perform Atomic Transaction with Date Range Overlap Check
    return await prisma.$transaction(async (tx) => {
      // Check item exists and isActive
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { owner: true },
      });

      if (!item || !item.isActive) {
        throw new Error('Item not found or inactive');
      }

      if (item.ownerId === renterId) {
        throw new Error('Owner cannot rent their own item');
      }

      // Check date range overlap on Booking table
      const overlappingBookings = await tx.booking.findMany({
        where: {
          itemId,
          status: 'CONFIRMED',
          AND: [
            { startDate: { lt: end } },
            { endDate: { gt: start } },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        throw new ConcurrencyConflictError('Item is already booked for the requested date range');
      }

      // Calculate Total Amount
      const durationHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
      let durationUnits = durationHours;
      if (item.pricingUnit === 'DAY') durationUnits = Math.ceil(durationHours / 24);
      else if (item.pricingUnit === 'WEEK') durationUnits = Math.ceil(durationHours / (24 * 7));
      else if (item.pricingUnit === 'USE') durationUnits = 1;

      const totalAmount = item.basePrice * durationUnits;

      // Compile frozen contract snapshot
      let templateClauses;
      let templateName;
      if (templateId) {
        const template = await tx.contractTemplate.findUnique({ where: { id: templateId } });
        if (template) {
          templateClauses = template.clauses as any;
          templateName = template.name;
        }
      }

      const compiledSnapshot = compileContractClauses(templateClauses, templateName, templateId);

      // Create Agreement
      const agreement = await tx.agreement.create({
        data: {
          itemId,
          renterId,
          ownerId: item.ownerId,
          startDate: start,
          endDate: end,
          compiledClauses: compiledSnapshot as any,
          status: 'PENDING_ACCEPTANCE',
          escrowState: 'UNFUNDED',
          totalAmount,
          auditLog: [],
        },
      });

      // Create Booking reservation
      await tx.booking.create({
        data: {
          itemId,
          agreementId: agreement.id,
          startDate: start,
          endDate: end,
          status: 'CONFIRMED',
        },
      });

      // Append Audit Log
      const initialLog = [
        {
          actorId: renterId,
          actorRole: 'RENTER',
          action: 'CREATE_BOOKING_REQUEST',
          timestamp: new Date().toISOString(),
          details: { totalAmount, startDate, endDate },
        },
      ];

      const updatedAgreement = await tx.agreement.update({
        where: { id: agreement.id },
        data: { auditLog: initialLog as any },
        include: {
          item: true,
          renter: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      return updatedAgreement;
    });
  } finally {
    await releaseLock(lockKey);
  }
}
