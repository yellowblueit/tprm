import { Prisma } from '@prisma/client';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getPrisma } from '../../services/prisma.service.js';
import { encrypt, decrypt, maskCredential } from '../../services/encryption.service.js';
import { NotFoundError } from '../../utils/errors.js';

const MASK_PREFIX = '••••';

export class IntegrationService {
  private get prisma() {
    return getPrisma();
  }

  /**
   * List all integrations for a tenant (credentials masked).
   */
  async list(tenantId: string) {
    const integrations = await this.prisma.tenantIntegration.findMany({
      where: { tenantId },
      orderBy: { type: 'asc' },
    });

    return integrations.map((i) => this.maskIntegration(i));
  }

  /**
   * Get a single integration by type (credentials masked).
   */
  async get(tenantId: string, type: string) {
    const integration = await this.prisma.tenantIntegration.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    if (!integration) return null;
    return this.maskIntegration(integration);
  }

  /**
   * Create or update an integration. Encrypts credential fields before storing.
   */
  async upsert(
    tenantId: string,
    type: string,
    data: {
      displayName?: string;
      config?: Record<string, unknown>;
      credentials?: Record<string, string>;
    }
  ) {
    // Get existing integration to handle partial credential updates
    const existing = await this.prisma.tenantIntegration.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    // Encrypt credential fields
    let encryptedCredentials: Record<string, string> | undefined;
    if (data.credentials) {
      const existingCreds = (existing?.credentials as Record<string, string>) ?? {};
      encryptedCredentials = {};

      for (const [key, value] of Object.entries(data.credentials)) {
        if (value.startsWith(MASK_PREFIX)) {
          // User didn't change this field — keep existing encrypted value
          encryptedCredentials[key] = existingCreds[key] ?? '';
        } else {
          // New plaintext value — encrypt it
          encryptedCredentials[key] = encrypt(value);
        }
      }
    }

    const integration = await this.prisma.tenantIntegration.upsert({
      where: { tenantId_type: { tenantId, type } },
      create: {
        tenantId,
        type,
        displayName: data.displayName ?? type,
        config: (data.config as Prisma.InputJsonValue) ?? undefined,
        credentials: (encryptedCredentials as Prisma.InputJsonValue) ?? undefined,
        isActive: false,
      },
      update: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.config !== undefined ? { config: data.config as Prisma.InputJsonValue } : {}),
        ...(encryptedCredentials !== undefined ? { credentials: encryptedCredentials as Prisma.InputJsonValue } : {}),
      },
    });

    return this.maskIntegration(integration);
  }

  /**
   * Remove an integration.
   */
  async delete(tenantId: string, type: string) {
    const integration = await this.prisma.tenantIntegration.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    if (!integration) throw new NotFoundError('Integration', type);

    await this.prisma.tenantIntegration.delete({
      where: { id: integration.id },
    });
  }

  /**
   * Test the integration connection. Updates lastTestedAt and lastTestStatus.
   */
  async testConnection(tenantId: string, type: string) {
    const integration = await this.prisma.tenantIntegration.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    if (!integration) throw new NotFoundError('Integration', type);

    let success = false;
    let message = '';

    try {
      switch (type) {
        case 'S3': {
          const result = await this.testS3Connection(integration);
          success = result.success;
          message = result.message;
          break;
        }
        default:
          message = `Connection test not implemented for type: ${type}`;
          break;
      }
    } catch (err) {
      message = err instanceof Error ? err.message : 'Unknown error';
    }

    // Update test status
    await this.prisma.tenantIntegration.update({
      where: { id: integration.id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: success ? 'success' : 'failure',
        isActive: success,
      },
    });

    return { success, message };
  }

  /**
   * Get decrypted credentials for internal use (e.g., by S3 service).
   * Never expose this data to API consumers.
   */
  async getDecryptedCredentials(tenantId: string, type: string): Promise<Record<string, string> | null> {
    const integration = await this.prisma.tenantIntegration.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    if (!integration || !integration.credentials) return null;
    if (!integration.isActive) return null;

    const encrypted = integration.credentials as Record<string, string>;
    const decrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(encrypted)) {
      if (value) {
        decrypted[key] = decrypt(value);
      }
    }

    return decrypted;
  }

  /**
   * Get decrypted config + credentials for a specific integration type.
   */
  async getFullConfig(tenantId: string, type: string) {
    const integration = await this.prisma.tenantIntegration.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    if (!integration || !integration.isActive) return null;

    const config = (integration.config as Record<string, unknown>) ?? {};
    const creds = await this.getDecryptedCredentials(tenantId, type);

    return { config, credentials: creds };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Mask credential values for safe API response.
   */
  private maskIntegration(integration: {
    id: string;
    tenantId: string;
    type: string;
    displayName: string;
    config: unknown;
    credentials: unknown;
    isActive: boolean;
    lastTestedAt: Date | null;
    lastTestStatus: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const creds = integration.credentials as Record<string, string> | null;
    let maskedCreds: Record<string, string | null> | null = null;

    if (creds) {
      maskedCreds = {};
      for (const [key, encryptedValue] of Object.entries(creds)) {
        try {
          const plaintext = decrypt(encryptedValue);
          maskedCreds[key] = maskCredential(plaintext);
        } catch {
          maskedCreds[key] = '••••****';
        }
      }
    }

    return {
      id: integration.id,
      type: integration.type,
      displayName: integration.displayName,
      config: integration.config,
      credentials: maskedCreds,
      isActive: integration.isActive,
      lastTestedAt: integration.lastTestedAt,
      lastTestStatus: integration.lastTestStatus,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  /**
   * Test S3/Wasabi connection by attempting HeadBucket.
   */
  private async testS3Connection(integration: {
    config: unknown;
    credentials: unknown;
  }): Promise<{ success: boolean; message: string }> {
    const config = (integration.config as Record<string, unknown>) ?? {};
    const encryptedCreds = (integration.credentials as Record<string, string>) ?? {};

    const accessKey = encryptedCreds.accessKey ? decrypt(encryptedCreds.accessKey) : '';
    const secretKey = encryptedCreds.secretKey ? decrypt(encryptedCreds.secretKey) : '';

    if (!accessKey || !secretKey) {
      return { success: false, message: 'Access key and secret key are required' };
    }

    const endpoint = (config.endpoint as string) || '';
    const region = (config.region as string) || 'us-east-1';
    const forcePathStyle = config.forcePathStyle !== false;
    const bucketArtifacts = (config.bucketArtifacts as string) || 'tprm-artifacts';

    if (!endpoint) {
      return { success: false, message: 'S3 endpoint URL is required' };
    }

    const client = new S3Client({
      endpoint,
      region,
      forcePathStyle,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucketArtifacts }));
      client.destroy();
      return { success: true, message: `Connected successfully. Bucket "${bucketArtifacts}" is accessible.` };
    } catch (err: unknown) {
      client.destroy();
      const code = (err as { name?: string }).name ?? 'UnknownError';
      if (code === 'NotFound' || code === '404') {
        return { success: false, message: `Bucket "${bucketArtifacts}" not found. Please create it first.` };
      }
      if (code === 'Forbidden' || code === '403' || code === 'AccessDenied') {
        return { success: false, message: 'Access denied. Check your access key and secret key.' };
      }
      return { success: false, message: `Connection failed: ${(err as Error).message}` };
    }
  }
}
