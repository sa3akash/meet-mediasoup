import { Elysia, t } from "elysia";
import { whiteboardService, type WhiteboardElement } from "./whiteboard-service";
import { broadcastToRoom } from "../signaling/socket-registry";
import { apiDoc, SwaggerTags } from "../../infrastructure/swagger/swagger-helpers";

export const whiteboardRoutes = new Elysia({ prefix: "/api/whiteboards" })
  /**
   * Get full whiteboard state for a meeting
   */
  .get(
    "/:meetingId",
    async ({ params: { meetingId } }) => {
      const elements = await whiteboardService.getState(meetingId);
      return { success: true, elements };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.WHITEBOARD,
        summary: "Get full whiteboard state",
        description: "Fetches all collaborative whiteboard elements for a given meeting room.",
      }),
      params: t.Object({ meetingId: t.String() }),
    }
  )

  /**
   * Add a whiteboard element (draw path, shape, sticky note, text)
   */
  .post(
    "/:meetingId/elements",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const element = body as WhiteboardElement;
        if (!element || !element.id) {
          set.status = 400;
          return { error: "Invalid whiteboard element" };
        }

        element.createdAt = element.createdAt || new Date().toISOString();
        element.updatedAt = new Date().toISOString();

        const created = await whiteboardService.addObject(meetingId, element);
        broadcastToRoom(meetingId, {
          event: "whiteboard:elementAdded",
          data: { element: created },
        });

        return { success: true, element: created };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to add whiteboard element" };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.WHITEBOARD,
        summary: "Add whiteboard element",
        description: "Creates and broadcasts a new collaborative canvas element in real-time.",
      }),
      params: t.Object({ meetingId: t.String() }),
      body: t.Object({
        id: t.String(),
        type: t.Union([
          t.Literal("path"),
          t.Literal("shape"),
          t.Literal("sticky"),
          t.Literal("text"),
          t.Literal("rectangle"),
          t.Literal("circle"),
          t.Literal("line"),
          t.Literal("arrow"),
        ]),
        data: t.Any(),
        createdBy: t.Optional(t.String()),
        createdByName: t.Optional(t.String()),
        color: t.Optional(t.String()),
        strokeWidth: t.Optional(t.Number()),
        createdAt: t.Optional(t.String()),
        updatedAt: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update an existing whiteboard element
   */
  .patch(
    "/:meetingId/elements/:elementId",
    async ({ params: { meetingId, elementId }, body, set }) => {
      try {
        const updated = await whiteboardService.updateObject(meetingId, elementId, body as Partial<WhiteboardElement>);
        if (!updated) {
          set.status = 404;
          return { error: "Whiteboard element not found" };
        }

        broadcastToRoom(meetingId, {
          event: "whiteboard:elementUpdated",
          data: { element: updated },
        });

        return { success: true, element: updated };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to update whiteboard element" };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.WHITEBOARD,
        summary: "Update whiteboard element",
        description: "Updates geometry, text, or coordinates of an existing whiteboard element.",
      }),
      params: t.Object({ meetingId: t.String(), elementId: t.String() }),
      body: t.Object({
        data: t.Optional(t.Any()),
        color: t.Optional(t.String()),
        strokeWidth: t.Optional(t.Number()),
      }),
    }
  )

  /**
   * Delete an element from the whiteboard
   */
  .delete(
    "/:meetingId/elements/:elementId",
    async ({ params: { meetingId, elementId } }) => {
      const success = await whiteboardService.deleteObject(meetingId, elementId);
      broadcastToRoom(meetingId, {
        event: "whiteboard:elementDeleted",
        data: { elementId },
      });
      return { success };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.WHITEBOARD,
        summary: "Delete whiteboard element",
        description: "Removes an element from the canvas.",
      }),
      params: t.Object({ meetingId: t.String(), elementId: t.String() }),
    }
  )

  /**
   * Clear the entire whiteboard
   */
  .delete(
    "/:meetingId/clear",
    async ({ params: { meetingId } }) => {
      const success = await whiteboardService.clearBoard(meetingId);
      broadcastToRoom(meetingId, {
        event: "whiteboard:cleared",
        data: { meetingId },
      });
      return { success };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.WHITEBOARD,
        summary: "Clear whiteboard",
        description: "Wipes all drawn strokes and elements from the canvas.",
      }),
      params: t.Object({ meetingId: t.String() }),
    }
  );
