import { departmentRepository } from './department.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { CreateDepartmentInput, UpdateDepartmentInput } from './department.schema';

export class DepartmentService {
  async getAllDepartments() {
    return departmentRepository.findAll();
  }

  async getDepartmentById(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found.');
    }
    return department;
  }

  async createDepartment(data: CreateDepartmentInput) {
    const existingCode = await departmentRepository.findByCode(data.code.toUpperCase());
    if (existingCode) {
      throw new ConflictError(`Department code '${data.code.toUpperCase()}' is already in use.`);
    }

    const existingName = await departmentRepository.findByName(data.name);
    if (existingName) {
      throw new ConflictError(`Department '${data.name}' already exists.`);
    }

    return departmentRepository.create(data);
  }

  async updateDepartment(id: string, data: UpdateDepartmentInput) {
    await this.getDepartmentById(id);

    if (data.code) {
      const existingCode = await departmentRepository.findByCode(data.code.toUpperCase());
      if (existingCode && existingCode.id !== id) {
        throw new ConflictError(`Department code '${data.code.toUpperCase()}' is already in use.`);
      }
    }

    if (data.name) {
      const existingName = await departmentRepository.findByName(data.name);
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Department '${data.name}' already exists.`);
      }
    }

    return departmentRepository.update(id, data);
  }

  async deleteDepartment(id: string) {
    const department = await this.getDepartmentById(id);

    if (department._count.employees > 0) {
      throw new BadRequestError(
        `Cannot delete department '${department.name}' because it contains ${department._count.employees} active employee(s).`
      );
    }

    return departmentRepository.delete(id);
  }
}

export const departmentService = new DepartmentService();
