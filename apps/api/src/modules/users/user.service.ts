import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { buildPrismaSkipTake, buildPaginationMeta, type PaginatedResult } from '../../utils/pagination.js';
import type { User } from '@prisma/client';

export class UserService {
  private get prisma() {
    return getPrisma();
  }

  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    search?: string
  ): Promise<PaginatedResult<User>> {
    const where = {
      tenantId,
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...buildPrismaSkipTake(page, pageSize),
        orderBy: { displayName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async getById(id: string, tenantId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async getByEntraId(entraObjectId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { entraObjectId },
    });
  }

  async invite(data: {
    tenantId: string;
    email: string;
    displayName: string;
    role: string;
  }): Promise<User> {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId: data.tenantId, email: data.email },
    });
    if (existing) {
      throw new ConflictError(`User with email "${data.email}" already exists in this tenant`);
    }

    // Create a placeholder user that will be linked when they first log in
    return this.prisma.user.create({
      data: {
        tenantId: data.tenantId,
        entraObjectId: `pending:${data.email}`, // Will be updated on first login
        email: data.email,
        displayName: data.displayName,
        role: data.role as never,
        isActive: true,
      },
    });
  }

  async updateRole(id: string, tenantId: string, role: string): Promise<User> {
    const user = await this.getById(id, tenantId);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { role: role as never },
    });
  }

  async deactivate(id: string, tenantId: string): Promise<User> {
    const user = await this.getById(id, tenantId);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });
  }

  async getCurrentUser(entraObjectId: string): Promise<User & { tenant: { id: string; name: string; type: string } }> {
    const user = await this.prisma.user.findUnique({
      where: { entraObjectId },
      include: { tenant: { select: { id: true, name: true, type: true } } },
    });
    if (!user) throw new NotFoundError('User', entraObjectId);
    return user;
  }
}
