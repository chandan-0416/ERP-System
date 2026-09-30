import { employeeRepository } from './employee.repository';
import { departmentRepository } from '../departments/department.repository';
import { designationRepository } from '../designations/designation.repository';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { CreateEmployeeInput, UpdateEmployeeInput, GetEmployeesQuery } from './employee.schema';

export class EmployeeService {
  async getEmployees(query: GetEmployeesQuery) {
    return employeeRepository.findAll(query);
  }

  async getEmployeeById(id: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee profile not found.');
    }
    return employee;
  }

  async createEmployee(data: CreateEmployeeInput) {
    // 1. Verify unique employee code
    const existingCode = await employeeRepository.findByCode(data.employeeCode.toUpperCase());
    if (existingCode) {
      throw new ConflictError(`Employee code '${data.employeeCode.toUpperCase()}' is already in use.`);
    }

    // 2. Verify unique email
    const existingEmail = await employeeRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError(`Employee with email '${data.email}' already exists.`);
    }

    // 3. Verify Department exists
    const department = await departmentRepository.findById(data.departmentId);
    if (!department) {
      throw new NotFoundError('Selected Department does not exist.');
    }

    // 4. Verify Designation exists & belongs to the department
    const designation = await designationRepository.findById(data.designationId);
    if (!designation) {
      throw new NotFoundError('Selected Designation does not exist.');
    }

    return employeeRepository.create(data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput) {
    await this.getEmployeeById(id);

    if (data.email) {
      const existingEmail = await employeeRepository.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictError(`Email '${data.email}' is already in use by another employee.`);
      }
    }

    if (data.departmentId) {
      const department = await departmentRepository.findById(data.departmentId);
      if (!department) {
        throw new NotFoundError('Department not found.');
      }
    }

    if (data.designationId) {
      const designation = await designationRepository.findById(data.designationId);
      if (!designation) {
        throw new NotFoundError('Designation not found.');
      }
    }

    return employeeRepository.update(id, data);
  }

  async deleteEmployee(id: string) {
    await this.getEmployeeById(id);
    return employeeRepository.delete(id);
  }
}

export const employeeService = new EmployeeService();
