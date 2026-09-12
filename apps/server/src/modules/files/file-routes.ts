import { Elysia, t } from "elysia";
import { fileService } from "./file-service";
import { broadcastToRoom } from "../signaling/socket-registry";
import { apiDoc, SwaggerTags } from "../../infrastructure/swagger/swagger-helpers";

export const fileRoutes = new Elysia({ prefix: "/api/files" })
  .get(
    "/:meetingId",
    async ({ params: { meetingId } }) => {
      const files = await fileService.getMeetingFiles(meetingId);
      return { success: true, files };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.FILES,
        summary: "Get files shared in meeting",
        description: "Returns metadata for all files and documents uploaded within a specific meeting room.",
      }),
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  )
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
    },
    {
      ...apiDoc({
        tag: SwaggerTags.FILES,
        summary: "Upload file to meeting",
        description: "Uploads documents, images, or media to S3/MinIO and notifies room participants.",
      }),
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  )
  .delete(
    "/:meetingId/:fileId",
    async ({ params: { meetingId, fileId } }) => {
      const success = await fileService.deleteFile(meetingId, fileId);
      if (success) {
        broadcastToRoom(meetingId, {
          event: "file:deleted",
          data: { fileId },
        });
      }
      return { success };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.FILES,
        summary: "Delete uploaded file",
        description: "Deletes a previously uploaded file from storage and notifies participants.",
      }),
      params: t.Object({
        meetingId: t.String(),
        fileId: t.String(),
      }),
    }
  );

