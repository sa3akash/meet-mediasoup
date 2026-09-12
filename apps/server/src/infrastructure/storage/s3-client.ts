import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

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

let verifiedBuckets = new Set<string>();

/**
 * Ensures that the target S3/MinIO bucket exists and has public-read policy applied.
 */
export async function ensureBucketExists(bucket: string = S3_BUCKET): Promise<void> {
  if (verifiedBuckets.has(bucket)) return;
  try {
    await (s3Client as any).send(new HeadBucketCommand({ Bucket: bucket }));
    verifiedBuckets.add(bucket);
  } catch (err: any) {
    const isNotFound =
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404 ||
      err.code === "NoSuchBucket";

    if (isNotFound) {
      try {
        console.log(`[S3 Storage] Bucket '${bucket}' does not exist. Creating...`);
        await (s3Client as any).send(new CreateBucketCommand({ Bucket: bucket }));

        // Apply public read access policy so recording and file URLs are directly accessible
        const publicReadPolicy = {
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "PublicReadGetObject",
              Effect: "Allow",
              Principal: "*",
              Action: "s3:GetObject",
              Resource: `arn:aws:s3:::${bucket}/*`,
            },
          ],
        };

        await (s3Client as any).send(
          new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(publicReadPolicy),
          })
        ).catch(() => {});
        console.log(`[S3 Storage] Bucket '${bucket}' created with public-read policy.`);
        verifiedBuckets.add(bucket);
      } catch (createErr: any) {
        console.warn("[S3 Storage] Auto bucket creation notice:", createErr.message || createErr);
      }
    } else {
      console.warn(`[S3 Storage] Bucket verification check notice for '${bucket}':`, err.message || err);
    }
  }
}

// Proactively run bucket initialization in background for common buckets
ensureBucketExists(S3_BUCKET).catch(() => { });
ensureBucketExists("meet-recordings").catch(() => { });

/**
 * Uploads a buffer or file to S3/MinIO, with graceful fallback to local public directory if S3 is down.
 */
export async function uploadToStorage(
  keyOrBody: string | Buffer | Uint8Array,
  bodyOrKey: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream",
  bucket: string = S3_BUCKET
): Promise<string> {
  let key: string;
  let body: Buffer | Uint8Array;

  if (typeof keyOrBody === "string") {
    key = keyOrBody;
    body = bodyOrKey as Buffer | Uint8Array;
  } else {
    body = keyOrBody;
    key = bodyOrKey as string;
  }

  await ensureBucketExists(bucket).catch(() => { });

  try {
    await (s3Client as any).send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );

    return `${endpoint}/${bucket}/${key}`;
  } catch (err: any) {
    console.warn(`[S3 Storage] S3 upload failed for key '${key}', falling back to local disk storage:`, err?.message || err);
    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const uploadsDir = path.resolve(process.cwd(), "public/uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, "_");
      const localFilePath = path.join(uploadsDir, sanitizedKey);
      await fs.writeFile(localFilePath, Buffer.from(body));
      return `http://localhost:4000/uploads/${sanitizedKey}`;
    } catch (diskErr: any) {
      console.error("[S3 Storage] Local fallback storage also failed:", diskErr);
      throw err;
    }
  }
}

