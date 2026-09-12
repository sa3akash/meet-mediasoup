import { db } from "../../../infrastructure/database";
import { users, sessions } from "../../../infrastructure/database/schema";
import { count, desc, eq, and, isNull, isNotNull, ilike, or } from "drizzle-orm";
import { auditService } from "../audit-service";

export class AdminUsersService {
  /**
   * Lists users with search query, role filtering, ban status, and pagination.
   */
  public async getUsers(query?: { search?: string; role?: string; isBanned?: boolean; limit?: number; offset?: number }) {
    const limit = query?.limit || 50;
    const offset = query?.offset || 0;

    const conditions = [isNull(users.deletedAt)];

    if (query?.search) {
      const s = `%${query.search.toLowerCase()}%`;
      conditions.push(or(ilike(users.name, s), ilike(users.email, s))!);
    }
    if (query?.role) {
      conditions.push(eq(users.role, query.role));
    }
    if (query?.isBanned !== undefined) {
      conditions.push(query.isBanned ? isNotNull(users.bannedAt) : isNull(users.bannedAt));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db.select({ count: count() }).from(users).where(whereClause);
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        presenceStatus: users.presenceStatus,
        isVerified: users.isVerified,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: userList,
      total: countResult?.count || 0,
      limit,
      offset,
    };
  }

  /**
   * Promotes or changes a user's role.
   */
  public async updateUserRole(userId: string, role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN", actorId?: string) {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    await auditService.logAction({
      actorId,
      action: "UPDATE_USER_ROLE",
      targetType: "USER",
      targetId: userId,
      details: { newRole: role },
    });

    return user;
  }

  /**
   * Soft deletes a user account.
   */
  public async deleteUser(userId: string, actorId?: string) {
    const [user] = await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));

    await auditService.logAction({
      actorId,
      action: "DELETE_USER",
      targetType: "USER",
      targetId: userId,
    });

    return user;
  }
}

export const adminUsersService = new AdminUsersService();
