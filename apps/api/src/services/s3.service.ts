import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '../config/env.js';

// ---------------------------------------------------------------------------
// Default (env-based) S3 client — fallback for system operations
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Per-tenant S3 client cache (TTL-based)
// ---------------------------------------------------------------------------

const TENANT_CLIENT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const tenantClients = new Map<string, { client: S3Client; expiresAt: number }>();

/**
 * Get an S3 client configured with per-tenant credentials from the database.
 * Falls back to env-based client if no tenant integration is configured.
 */
export async function getS3ForTenant(tenantId: string): Promise<S3Client> {
  // Check cache
  const cached = tenantClients.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.client;
  }

  // Lazy import to avoid circular dependency
  const { IntegrationService } = await import(
    '../modules/integrations/integration.service.js'
  );
  const integrationService = new IntegrationService();
  const fullConfig = await integrationService.getFullConfig(tenantId, 'S3');

  if (!fullConfig || !fullConfig.credentials) {
    return getS3(); // Fall back to env-based client
  }

  const config = fullConfig.config;
  const creds = fullConfig.credentials;

  const client = new S3Client({
    endpoint: (config.endpoint as string) || getEnv().S3_ENDPOINT,
    region: (config.region as string) || getEnv().S3_REGION,
    forcePathStyle: config.forcePathStyle !== false,
    credentials: {
      accessKeyId: creds.accessKey || getEnv().S3_ACCESS_KEY,
      secretAccessKey: creds.secretKey || getEnv().S3_SECRET_KEY,
    },
  });

  // Cache with TTL
  tenantClients.set(tenantId, {
    client,
    expiresAt: Date.now() + TENANT_CLIENT_TTL_MS,
  });

  return client;
}

/**
 * Clear cached tenant S3 client (e.g., after credential update).
 */
export function clearTenantS3Cache(tenantId: string): void {
  const cached = tenantClients.get(tenantId);
  if (cached) {
    cached.client.destroy();
    tenantClients.delete(tenantId);
  }
}

// ---------------------------------------------------------------------------
// Resolve the correct S3 client based on optional tenantId
// ---------------------------------------------------------------------------

async function resolveClient(tenantId?: string): Promise<S3Client> {
  if (tenantId) {
    return getS3ForTenant(tenantId);
  }
  return getS3();
}

// ---------------------------------------------------------------------------
// S3 operations (with optional per-tenant support)
// ---------------------------------------------------------------------------

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  tenantId?: string
): Promise<void> {
  const client = await resolveClient(tenantId);
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
  expiresIn = 3600,
  tenantId?: string
): Promise<string> {
  const client = await resolveClient(tenantId);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

export async function deleteObject(
  bucket: string,
  key: string,
  tenantId?: string
): Promise<void> {
  const client = await resolveClient(tenantId);
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

export async function headObject(
  bucket: string,
  key: string,
  tenantId?: string
): Promise<{ contentLength?: number; contentType?: string; lastModified?: Date }> {
  const client = await resolveClient(tenantId);
  const res = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key })
  );
  return {
    contentLength: res.ContentLength,
    contentType: res.ContentType,
    lastModified: res.LastModified,
  };
}
