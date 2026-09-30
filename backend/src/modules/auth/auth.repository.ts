import { prisma } from '../../config/db';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

const userWithRoleAndPermissions = {
  include: {
    role: {
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    },
  },
};

export class AuthRepository {
  /**
   * Find user by email with complete Role and Permissions
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      ...userWithRoleAndPermissions,
    });
  }

  /**
   * Find user by ID with complete Role and Permissions
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      ...userWithRoleAndPermissions,
    });
  }

  /**
   * Create a new user record
   */
  async createUser(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
      },
      ...userWithRoleAndPermissions,
    });
  }

  /**
   * Store a new refresh token
   */
  async createRefreshToken(data: CreateRefreshTokenData) {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find active unexpired refresh token by hash
   */
  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: userWithRoleAndPermissions,
      },
    });
  }

  /**
   * Delete a specific refresh token by ID (Rotation)
   */
  async deleteRefreshTokenById(id: string) {
    return prisma.refreshToken.delete({
      where: { id },
    });
  }

  /**
   * Delete refresh tokens by hash (Logout)
   */
  async deleteRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  /**
   * Delete all expired refresh tokens for a user (Cleanup)
   */
  async deleteUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get default role ID for registration
   */
  async getDefaultRoleId(): Promise<string> {
    const role = await prisma.role.findFirst({
      where: { name: 'EMPLOYEE' },
    });
    if (!role) {
      const anyRole = await prisma.role.findFirst();
      if (!anyRole) {
        throw new Error('No roles found in system. Please run database seed.');
      }
      return anyRole.id;
    }
    return role.id;
  }
}

export const authRepository = new AuthRepository();
