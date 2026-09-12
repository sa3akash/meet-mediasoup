import { Elysia, t } from "elysia";
import { adminUsersService } from "../services/admin-users-service";
import { moderationService } from "../../moderation/moderation-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const adminUsersRoutes = new Elysia()
  /**
   * Users Management
   */
  .get(
    "/users",
    async ({ query }) => {
      const { search, role, isBanned, limit, offset } = query;
      const res = await adminUsersService.getUsers({
        search,
        role,
        isBanned: isBanned === "true" ? true : isBanned === "false" ? false : undefined,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });
      return { success: true, ...res };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "List platform users",
        description: "Retrieves paginated user accounts with role, ban status, and search filters.",
      }),
      query: t.Object({
        search: t.Optional(t.String()),
        role: t.Optional(t.String()),
        isBanned: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update User Role
   */
  .patch(
    "/users/:id/role",
    async ({ params, body, set }) => {
      try {
        const user = await adminUsersService.updateUserRole(params.id, body.role as any, body.actorId);
        return { success: true, user };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Update user role",
        description: "Promotes or modifies a user's role (USER, MODERATOR, ADMIN, SUPER_ADMIN).",
      }),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        role: t.Union([
          t.Literal("USER"),
          t.Literal("MODERATOR"),
          t.Literal("ADMIN"),
          t.Literal("SUPER_ADMIN"),
        ]),
        actorId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Ban User
   */
  .post(
    "/users/:id/ban",
    async ({ params, body, set }) => {
      try {
        const user = await moderationService.banUser(params.id, body.actorId, body.reason);
        return { success: true, user, banned: true };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Ban user account",
        description: "Suspends account, revokes active sessions, and kicks user from meetings.",
      }),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        actorId: t.Optional(t.String()),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Unban User
   */
  .post(
    "/users/:id/unban",
    async ({ params, body, set }) => {
      try {
        const user = await moderationService.unbanUser(params.id, body.actorId);
        return { success: true, user, banned: false };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Unban user account",
        description: "Restores platform and meeting access for a previously suspended user.",
      }),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        actorId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete User
   */
  .delete(
    "/users/:id",
    async ({ params, body, set }) => {
      try {
        const actorId = (body as any)?.actorId;
        const user = await adminUsersService.deleteUser(params.id, actorId);
        return { success: true, user };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Delete user account",
        description: "Soft deletes user and invalidates all session tokens.",
      }),
      params: t.Object({ id: t.String() }),
    }
  );
