import { prisma } from '../../config/db';
import { AttendanceStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

export interface GetAttendanceFilters {
  page?: number;
  limit?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  departmentId?: string;
  status?: AttendanceStatus;
}

export function getDayRange(dateInput?: string | Date) {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string' && dateInput.includes('T')) {
    d = new Date(dateInput);
  } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const [y, m, day] = dateInput.split('T')[0].split('-').map(Number);
    d = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
  } else {
    d = new Date(dateInput);
  }

  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  const noon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0));

  return { start, end, exact: noon };
}

export class AttendanceService {
  async resolveEmployeeId(idOrUserId?: string): Promise<string> {
    if (!idOrUserId) {
      const firstEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
      if (!firstEmp) throw new NotFoundError('No active employee profile found in system');
      return firstEmp.id;
    }

    // Direct Employee ID match
    const empById = await prisma.employee.findUnique({ where: { id: idOrUserId } });
    if (empById) return empById.id;

    // User ID match
    const empByUserId = await prisma.employee.findFirst({ where: { userId: idOrUserId } });
    if (empByUserId) return empByUserId.id;

    // User Email match
    const user = await prisma.user.findUnique({ where: { id: idOrUserId } });
    if (user) {
      const empByEmail = await prisma.employee.findUnique({ where: { email: user.email } });
      if (empByEmail) return empByEmail.id;
    }

    // Fallback to first active employee
    const fallback = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
    if (!fallback) throw new NotFoundError('No active employee profile found in system');
    return fallback.id;
  }

  async getAttendance(filters: GetAttendanceFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.departmentId) {
      where.employee = {
        departmentId: filters.departmentId,
      };
    }

    if (filters.date) {
      const { start, end } = getDayRange(filters.date);
      where.date = { gte: start, lte: end };
    } else if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        const { start } = getDayRange(filters.startDate);
        where.date.gte = start;
      }
      if (filters.endDate) {
        const { end } = getDayRange(filters.endDate);
        where.date.lte = end;
      }
    }

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { id: true, name: true, code: true } },
              designation: { select: { id: true, title: true } },
            },
          },
        },
      }),
    ]);

    return {
      attendances,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async logAttendance(data: {
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) {
    const { exact: targetDate } = getDayRange(data.date);

    const checkInDate = data.checkIn ? new Date(data.checkIn) : null;
    const checkOutDate = data.checkOut ? new Date(data.checkOut) : null;

    return prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: targetDate,
        },
      },
      update: {
        status: data.status,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        notes: data.notes,
      },
      create: {
        employeeId: data.employeeId,
        date: targetDate,
        status: data.status,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        notes: data.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  async clockIn(rawEmployeeId?: string) {
    const employeeId = await this.resolveEmployeeId(rawEmployeeId);
    const { exact: today } = getDayRange();

    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    return prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      update: {
        checkIn: now,
        status,
      },
      create: {
        employeeId,
        date: today,
        checkIn: now,
        status,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async clockOut(rawEmployeeId?: string) {
    const employeeId = await this.resolveEmployeeId(rawEmployeeId);
    const { exact: today } = getDayRange();

    const now = new Date();

    return prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      update: {
        checkOut: now,
      },
      create: {
        employeeId,
        date: today,
        checkIn: now,
        checkOut: now,
        status: AttendanceStatus.PRESENT,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async getStats() {
    const { start: todayStart, end: todayEnd } = getDayRange();

    const [totalEmployees, todayAttendances] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    const presentCount = todayAttendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const lateCount = todayAttendances.filter((a) => a.status === AttendanceStatus.LATE).length;
    const halfDayCount = todayAttendances.filter((a) => a.status === AttendanceStatus.HALF_DAY).length;
    const onLeaveCount = todayAttendances.filter((a) => a.status === AttendanceStatus.ON_LEAVE).length;
    const loggedCount = presentCount + lateCount + halfDayCount + onLeaveCount;
    const absentCount = Math.max(0, totalEmployees - loggedCount);

    const totalActivePresent = presentCount + lateCount + halfDayCount;
    const attendanceRate = totalEmployees > 0 ? Math.round((totalActivePresent / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      presentCount,
      lateCount,
      halfDayCount,
      onLeaveCount,
      absentCount,
      attendanceRate,
    };
  }
}

export const attendanceService = new AttendanceService();
