import { roleRepository } from './role.repository';
import { NotFoundError } from '../../utils/errors';

export class RoleService {
  async getAllRoles() {
    const roles = await roleRepository.findAllRoles();
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      userCount: r._count.users,
      permissions: r.rolePermissions.map((rp) => rp.permission.name),
    }));
  }

  async getAllPermissions() {
    return roleRepository.findAllPermissions();
  }

  async assignRole(userId: string, roleId: string) {
    const role = await roleRepository.findRoleById(roleId);
    if (!role) {
      throw new NotFoundError('Target role does not exist.');
    }
    return roleRepository.assignRoleToUser(userId, roleId);
  }
}

export const roleService = new RoleService();
