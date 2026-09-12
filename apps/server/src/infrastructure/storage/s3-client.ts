import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_KEY || "miniopassword";
export const S3_BUCKET = process.env.S3_BUCKET || "meet-uploads";

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

export async function uploadToStorage(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  await (s3Client as any).send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${endpoint}/${S3_BUCKET}/${key}`;
}
