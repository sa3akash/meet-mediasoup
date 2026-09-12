import { Elysia, t } from "elysia";
import { adminOverviewService } from "../services/admin-overview-service";
import { auditService } from "../audit-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const adminOverviewRoutes = new Elysia()
  /**
   * System Overview & Platform KPIs
   */
  .get(
    "/overview",
    async () => {
      const stats = await adminOverviewService.getOverviewStats();
      return { success: true, stats };
    },
    apiDoc({
      tag: SwaggerTags.ADMIN,
      summary: "Get platform overview KPIs",
      description: "Aggregates total users, active meetings, cloud recordings, and storage footprint.",
    })
  )

  /**
   * Storage Breakdown
   */
  .get(
    "/storage",
    async () => {
      const storage = await adminOverviewService.getStorageOverview();
      return { success: true, storage };
    },
    apiDoc({
      tag: SwaggerTags.ADMIN,
      summary: "Get storage breakdown",
      description: "Returns storage metrics partitioned by recordings, files, and S3 bucket health.",
    })
  )

  /**
   * Audit Logs
   */
  .get(
    "/audit-logs",
    async ({ query }) => {
      const { limit = "50", offset = "0" } = query;
      const logs = await auditService.getAuditLogs(parseInt(limit, 10), parseInt(offset, 10));
      return { success: true, logs, count: logs.length };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Get system audit logs",
        description: "Retrieves immutable timeline of administrative, moderation, and meeting actions.",
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  );
