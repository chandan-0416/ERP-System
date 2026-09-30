import { authRepository } from './auth.repository';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../utils/token';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.schema';

export class AuthService {
  private extractPermissions(user: any): string[] {
    if (!user.role?.rolePermissions) return [];
    return user.role.rolePermissions.map((rp: any) => rp.permission.name);
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);

    if (existing) {
      throw new ConflictError('A user with this email already exists.');
    }

    const roleId = input.roleId || (await authRepository.getDefaultRoleId());
    const hashedPassword = await hashPassword(input.password);

    const user = await authRepository.createUser({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId,
    });

    const permissions = this.extractPermissions(user);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    });

    const { token: refreshToken, hash: tokenHash } = generateRefreshToken();

    // Store refresh token in repository (expires in 7 days)
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with credentials
   */
  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const permissions = this.extractPermissions(user);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    });

    const { token: refreshToken, hash: tokenHash } = generateRefreshToken();

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token via token rotation
   */
  async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token required.');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken || !storedToken.user || !storedToken.user.isActive) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    // Refresh Token Rotation: Delete old token
    await authRepository.deleteRefreshTokenById(storedToken.id);

    const permissions = this.extractPermissions(storedToken.user);

    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role.name,
      permissions,
    });

    const { token: newRefreshToken, hash: newTokenHash } = generateRefreshToken();

    // Create new refresh token
    await authRepository.createRefreshToken({
      userId: storedToken.user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role.name,
        permissions,
      },
    };
  }

  /**
   * Logout user and invalidate refresh token
   */
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await authRepository.deleteRefreshTokenByHash(tokenHash);
    }
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId: string) {
    const user = await authRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new NotFoundError('User not found.');
    }

    const permissions = this.extractPermissions(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      permissions,
    };
  }
}

export const authService = new AuthService();
