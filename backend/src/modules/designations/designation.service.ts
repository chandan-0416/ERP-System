import { designationRepository } from './designation.repository';
import { departmentRepository } from '../departments/department.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { CreateDesignationInput } from './designation.schema';

export class DesignationService {
  async getAllDesignations(departmentId?: string) {
    return designationRepository.findAll(departmentId);
  }

  async getDesignationById(id: string) {
    const designation = await designationRepository.findById(id);
    if (!designation) {
      throw new NotFoundError('Designation not found.');
    }
    return designation;
  }

  async createDesignation(data: CreateDesignationInput) {
    const department = await departmentRepository.findById(data.departmentId);
    if (!department) {
      throw new NotFoundError('Department not found.');
    }

    const existing = await designationRepository.findByTitle(data.title);
    if (existing) {
      throw new ConflictError(`Designation '${data.title}' already exists.`);
    }

    return designationRepository.create(data);
  }

  async deleteDesignation(id: string) {
    const designation = await this.getDesignationById(id);

    if (designation._count.employees > 0) {
      throw new BadRequestError(
        `Cannot delete designation '${designation.title}' because it is assigned to ${designation._count.employees} employee(s).`
      );
    }

    return designationRepository.delete(id);
  }
}

export const designationService = new DesignationService();
