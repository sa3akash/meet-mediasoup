import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { uploadToStorage } from "../../../infrastructure/storage/s3-client";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const mediaRouter = new Elysia()
  .post(
    "/me/avatar",
    async ({ body, headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = file.name.split(".").pop() || "png";
        const key = `avatars/${decoded.userId}-${Date.now()}.${ext}`;

        const avatarUrl = await uploadToStorage(key, buffer, file.type);
        await db.update(users).set({ avatarUrl, updatedAt: new Date() }).where(eq(users.id, decoded.userId));

        return { avatarUrl };
      } catch (err: any) {
        set.status = 500;
        return { error: "Failed to upload avatar" };
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  )
  .post(
    "/me/cover",
    async ({ body, headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const file = body.file as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = file.name.split(".").pop() || "png";
        const key = `covers/${decoded.userId}-${Date.now()}.${ext}`;

        const coverUrl = await uploadToStorage(key, buffer, file.type);
        await db.update(users).set({ coverUrl, updatedAt: new Date() }).where(eq(users.id, decoded.userId));

        return { coverUrl };
      } catch (err: any) {
        set.status = 500;
        return { error: "Failed to upload cover" };
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  );
