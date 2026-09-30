import { prisma } from '../../config/db';
import { CreateDepartmentInput, UpdateDepartmentInput } from './department.schema';

export class DepartmentRepository {
  async findAll() {
    return prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true, designations: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        designations: true,
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            designation: { select: { title: true } },
          },
        },
        _count: {
          select: { employees: true, designations: true },
        },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
    });
  }

  async findByName(name: string) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  async create(data: CreateDepartmentInput) {
    return prisma.department.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
      },
    });
  }

  async update(id: string, data: UpdateDepartmentInput) {
    return prisma.department.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
    });
  }

  async delete(id: string) {
    return prisma.department.delete({
      where: { id },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
