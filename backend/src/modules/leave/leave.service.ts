import { prisma } from '../../config/db';
import { LeaveType, LeaveStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

export interface GetLeaveFilters {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
}

export class LeaveService {
  async getLeaves(filters: GetLeaveFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.leaveType) where.leaveType = filters.leaveType;

    const [total, leaves] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { name: true } },
              designation: { select: { title: true } },
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      leaves,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createLeave(data: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    return prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: start,
        endDate: end,
        days: data.days,
        reason: data.reason,
        status: LeaveStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateLeaveStatus(id: string, status: LeaveStatus, approvedById?: string, rejectionReason?: string) {
    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Leave request not found');

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedById: status === LeaveStatus.APPROVED ? approvedById : null,
        rejectionReason: status === LeaveStatus.REJECTED ? rejectionReason : null,
      },
      include: {
        employee: true,
      },
    });

    // If approved, mark employee attendance as ON_LEAVE for start/end range
    if (status === LeaveStatus.APPROVED) {
      const cur = new Date(updated.startDate);
      const end = new Date(updated.endDate);
      while (cur <= end) {
        const dayDate = new Date(cur);
        dayDate.setHours(0, 0, 0, 0);

        await prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: updated.employeeId,
              date: dayDate,
            },
          },
          update: {
            status: 'ON_LEAVE',
            notes: `Approved leave: ${updated.leaveType}`,
          },
          create: {
            employeeId: updated.employeeId,
            date: dayDate,
            status: 'ON_LEAVE',
            notes: `Approved leave: ${updated.leaveType}`,
          },
        });

        cur.setDate(cur.getDate() + 1);
      }
    }

    return updated;
  }

  async getBalances(employeeId?: string) {
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.leaveRequest.count({ where: { ...(employeeId ? { employeeId } : {}), status: LeaveStatus.PENDING } }),
      prisma.leaveRequest.count({ where: { ...(employeeId ? { employeeId } : {}), status: LeaveStatus.APPROVED } }),
      prisma.leaveRequest.count({ where: { ...(employeeId ? { employeeId } : {}), status: LeaveStatus.REJECTED } }),
    ]);

    const totalRequests = pendingCount + approvedCount + rejectedCount;

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalRequests,
      annualAllowance: 24,
      casualAllowance: 12,
      sickAllowance: 10,
    };
  }
}

export const leaveService = new LeaveService();
