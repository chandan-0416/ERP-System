import { prisma } from '../../config/db';
import { CreateDesignationInput } from './designation.schema';

export class DesignationRepository {
  async findAll(departmentId?: string) {
    return prisma.designation.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.designation.findUnique({
      where: { id },
      include: {
        department: true,
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async findByTitle(title: string) {
    return prisma.designation.findUnique({
      where: { title },
    });
  }

  async create(data: CreateDesignationInput) {
    return prisma.designation.create({
      data: {
        title: data.title,
        departmentId: data.departmentId,
      },
      include: {
        department: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.designation.delete({
      where: { id },
    });
  }
}

export const designationRepository = new DesignationRepository();
