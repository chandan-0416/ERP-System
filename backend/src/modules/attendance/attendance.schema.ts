import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

export const getAttendanceQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    employeeId: z.string().optional(),
    departmentId: z.string().optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
  }),
});

export const logAttendanceSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    date: z.string().min(1, 'Date is required'),
    status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateAttendanceSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(AttendanceStatus).optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    notes: z.string().optional(),
  }),
});
