import { Elysia } from "elysia";
import { fileService } from "./file-service";
import { broadcastToRoom } from "../signaling/socket-registry";

export const fileRoutes = new Elysia({ prefix: "/api/files" })
  .get("/:meetingId", async ({ params: { meetingId } }) => {
    const files = await fileService.getMeetingFiles(meetingId);
    return { success: true, files };
  })
  .post(
    "/:meetingId/upload",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const file = (body as any).file as File;
        if (!file) {
          set.status = 400;
          return { error: "No file provided" };
        }

        const userId = (body as any).userId || "anonymous";
        const displayName = (body as any).displayName || "Participant";

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadedFile = await fileService.uploadFile({
          meetingId,
          uploaderId: userId,
          uploaderName: displayName,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileBuffer: buffer,
        });

        broadcastToRoom(meetingId, {
          event: "file:uploaded",
          data: { file: uploadedFile },
        });

        return { success: true, file: uploadedFile };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to upload file" };
      }
    }
  )
  .delete("/:meetingId/:fileId", async ({ params: { meetingId, fileId } }) => {
    const success = await fileService.deleteFile(meetingId, fileId);
    if (success) {
      broadcastToRoom(meetingId, {
        event: "file:deleted",
        data: { fileId },
      });
    }
    return { success };
  });
