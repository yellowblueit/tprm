import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '../config/env.js';

let s3: S3Client | null = null;

export function getS3(): S3Client {
  if (!s3) {
    const env = getEnv();
    s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });
  }
  return s3;
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<void> {
  const client = getS3();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getPresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

export async function deleteObject(
  bucket: string,
  key: string
): Promise<void> {
  const client = getS3();
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

export async function headObject(
  bucket: string,
  key: string
): Promise<{ contentLength?: number; contentType?: string; lastModified?: Date }> {
  const client = getS3();
  const res = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key })
  );
  return {
    contentLength: res.ContentLength,
    contentType: res.ContentType,
    lastModified: res.LastModified,
  };
}
