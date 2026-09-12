import { Elysia, t } from "elysia";
import { whiteboardService, type WhiteboardElement } from "./whiteboard-service";
import { broadcastToRoom } from "../signaling/socket-registry";

export const whiteboardRoutes = new Elysia({ prefix: "/api/whiteboards" })
  // Get full whiteboard state for a meeting
  .get(
    "/:meetingId",
    async ({ params: { meetingId } }) => {
      const elements = await whiteboardService.getState(meetingId);
      return { success: true, elements };
    },
    {
      detail: {
        tags: ["Whiteboard"],
        summary: "Get full whiteboard state",
        description:
          "Fetches all active collaborative whiteboard elements (drawing paths, shapes, sticky notes, and text) for a given meeting room.",
        responses: {
          200: {
            description: "Whiteboard elements retrieved successfully",
          },
        },
      },
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  )
  // Add a whiteboard element (draw path, shape, sticky note, text)
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
      detail: {
        tags: ["Whiteboard"],
        summary: "Add a whiteboard element",
        description:
          "Creates a new collaborative whiteboard element (freehand path, shape, sticky note, or text box) and broadcasts it to all connected participants in real time.",
        responses: {
          200: {
            description: "Element added successfully",
          },
          400: {
            description: "Invalid whiteboard element data",
          },
          500: {
            description: "Internal server error while saving element",
          },
        },
      },
      params: t.Object({
        meetingId: t.String(),
      }),
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
  // Update an existing whiteboard element
  .put(
    "/:meetingId/elements/:elementId",
    async ({ params: { meetingId, elementId }, body, set }) => {
      try {
        const updates = body as Partial<WhiteboardElement>;
        const updated = await whiteboardService.updateObject(meetingId, elementId, updates);
        if (!updated) {
          set.status = 404;
          return { error: "Element not found" };
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
      detail: {
        tags: ["Whiteboard"],
        summary: "Update an existing whiteboard element",
        description:
          "Updates geometry, text content, color, or positions of an existing whiteboard element and broadcasts the patch to all participants.",
        responses: {
          200: {
            description: "Element updated successfully",
          },
          404: {
            description: "Element not found in meeting state",
          },
          500: {
            description: "Internal server error while updating element",
          },
        },
      },
      params: t.Object({
        meetingId: t.String(),
        elementId: t.String(),
      }),
      body: t.Object(
        {
          data: t.Optional(t.Any()),
          color: t.Optional(t.String()),
          strokeWidth: t.Optional(t.Number()),
        },
        { additionalProperties: true }
      ),
    }
  )
  // Delete a whiteboard element
  .delete(
    "/:meetingId/elements/:elementId",
    async ({ params: { meetingId, elementId } }) => {
      const success = await whiteboardService.deleteObject(meetingId, elementId);
      return { success };
    },
    {
      detail: {
        tags: ["Whiteboard"],
        summary: "Delete a whiteboard element",
        description: "Removes a specific whiteboard element from the canvas.",
        responses: {
          200: {
            description: "Element deleted successfully",
          },
        },
      },
      params: t.Object({
        meetingId: t.String(),
        elementId: t.String(),
      }),
    }
  )
  // Clear the entire whiteboard
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
      detail: {
        tags: ["Whiteboard"],
        summary: "Clear the entire whiteboard",
        description:
          "Wipes all drawn strokes, shapes, sticky notes, and text from the meeting canvas and notifies all participants.",
        responses: {
          200: {
            description: "Whiteboard cleared successfully",
          },
        },
      },
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  );
