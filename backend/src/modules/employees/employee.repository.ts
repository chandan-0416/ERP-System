import { prisma } from '../../config/db';
import { CreateEmployeeInput, UpdateEmployeeInput, GetEmployeesQuery } from './employee.schema';
import { Prisma } from '@prisma/client';

export class EmployeeRepository {
  async findAll(query: GetEmployeesQuery) {
    const { page = 1, limit = 10, search, departmentId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { employeeCode: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, code: true } },
          designation: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        designation: true,
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    });
  }

  async findByCode(employeeCode: string) {
    return prisma.employee.findUnique({
      where: { employeeCode },
    });
  }

  async findByEmail(email: string) {
    return prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(data: CreateEmployeeInput) {
    return prisma.employee.create({
      data: {
        employeeCode: data.employeeCode.toUpperCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : new Date(),
        salary: data.salary,
        status: data.status,
        departmentId: data.departmentId,
        designationId: data.designationId,
      },
      include: {
        department: true,
        designation: true,
      },
    });
  }

  async update(id: string, data: UpdateEmployeeInput) {
    return prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ? data.email.toLowerCase() : undefined,
        phone: data.phone,
        salary: data.salary,
        status: data.status,
        departmentId: data.departmentId,
        designationId: data.designationId,
      },
      include: {
        department: true,
        designation: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.employee.delete({
      where: { id },
    });
  }
}

export const employeeRepository = new EmployeeRepository();
