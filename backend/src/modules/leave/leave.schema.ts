import { z } from 'zod';
import { LeaveType, LeaveStatus } from '@prisma/client';

export const getLeavesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    employeeId: z.string().optional(),
    status: z.nativeEnum(LeaveStatus).optional(),
    leaveType: z.nativeEnum(LeaveType).optional(),
  }),
});

export const createLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    leaveType: z.nativeEnum(LeaveType),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    days: z.number().int().min(1).default(1),
    reason: z.string().min(3, 'Reason must be at least 3 characters'),
  }),
});

export const updateLeaveStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(LeaveStatus),
    rejectionReason: z.string().optional(),
  }),
});
