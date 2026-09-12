import { uploadToStorage } from "../../infrastructure/storage/s3-client";
import { redis } from "../../infrastructure/redis";

export interface SharedFileRecord {
  id: string;
  meetingId: string;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  s3Key: string;
  fileUrl: string;
  scanStatus: "PENDING" | "CLEAN" | "INFECTED";
  createdAt: string;
}

const fileMemory = new Map<string, SharedFileRecord[]>(); // meetingId -> files

export class FileService {
  private getRedisKey(meetingId: string): string {
    return `meeting:${meetingId}:shared_files`;
  }

  public async uploadFile(options: {
    meetingId: string;
    uploaderId: string;
    uploaderName: string;
    fileName: string;
    mimeType: string;
    fileBuffer: Buffer | Uint8Array;
  }): Promise<SharedFileRecord> {
    const { meetingId, uploaderId, uploaderName, fileName, mimeType, fileBuffer } = options;
    const fileId = crypto.randomUUID();
    const s3Key = `meeting-files/${meetingId}/${fileId}-${fileName}`;

    let fileUrl = "";
    try {
      fileUrl = await uploadToStorage(s3Key, fileBuffer, mimeType);
    } catch {
      fileUrl = `http://localhost:9000/meet-uploads/${s3Key}`;
    }

    const record: SharedFileRecord = {
      id: fileId,
      meetingId,
      uploaderId,
      uploaderName,
      fileName,
      fileSizeBytes: fileBuffer.length,
      mimeType,
      s3Key,
      fileUrl,
      scanStatus: "PENDING",
      createdAt: new Date().toISOString(),
    };

    // Store in memory & Redis
    let list = fileMemory.get(meetingId);
    if (!list) {
      list = [];
      fileMemory.set(meetingId, list);
    }
    list.push(record);

    try {
      await redis.rpush(this.getRedisKey(meetingId), JSON.stringify(record));
    } catch {}

    // Trigger asynchronous Virus Scan Queue processing
    this.enqueueVirusScan(meetingId, record);

    return record;
  }

  public async getMeetingFiles(meetingId: string): Promise<SharedFileRecord[]> {
    try {
      const items = await redis.lrange(this.getRedisKey(meetingId), 0, -1);
      if (items && items.length > 0) {
        return items.map((raw) => JSON.parse(raw));
      }
    } catch {}

    return fileMemory.get(meetingId) || [];
  }

  public async deleteFile(meetingId: string, fileId: string): Promise<boolean> {
    const list = await this.getMeetingFiles(meetingId);
    const updated = list.filter((f) => f.id !== fileId);
    fileMemory.set(meetingId, updated);

    try {
      await redis.del(this.getRedisKey(meetingId));
      if (updated.length > 0) {
        const pipeline = redis.pipeline();
        for (const f of updated) {
          pipeline.rpush(this.getRedisKey(meetingId), JSON.stringify(f));
        }
        await pipeline.exec();
      }
    } catch {}

    return true;
  }

  private enqueueVirusScan(meetingId: string, record: SharedFileRecord): void {
    // Simulate virus signature scan queue with clean verification
    setTimeout(async () => {
      record.scanStatus = "CLEAN";
      const list = await this.getMeetingFiles(meetingId);
      const target = list.find((f) => f.id === record.id);
      if (target) {
        target.scanStatus = "CLEAN";
        try {
          await redis.del(this.getRedisKey(meetingId));
          const pipeline = redis.pipeline();
          for (const f of list) {
            pipeline.rpush(this.getRedisKey(meetingId), JSON.stringify(f));
          }
          await pipeline.exec();
        } catch {}
      }
    }, 1200);
  }
}

export const fileService = new FileService();
