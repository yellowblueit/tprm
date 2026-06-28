import crypto from 'node:crypto';
import { getPrisma } from '../../services/prisma.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { uploadObject, getPresignedDownloadUrl, deleteObject } from '../../services/s3.service.js';
import { getEnv } from '../../config/env.js';

export class ArtifactService {
  private get prisma() {
    return getPrisma();
  }

  private get bucket() {
    return getEnv().S3_BUCKET_ARTIFACTS;
  }

  /**
   * List security artifacts for a vendor, most recent first.
   */
  async listByVendor(vendorId: string, tenantId: string) {
    // Verify vendor belongs to tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    return this.prisma.securityArtifact.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Upload a file to S3 and create a SecurityArtifact record.
   */
  async upload(
    vendorId: string,
    tenantId: string,
    file: { buffer: Buffer; filename: string; mimetype: string },
    metadata: {
      name: string;
      type: string;
      validFrom?: string;
      validUntil?: string;
    },
    userId: string
  ) {
    // Verify vendor belongs to tenant
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundError('Vendor', vendorId);

    // Generate a unique object key
    const objectKey = `${tenantId}/${vendorId}/${crypto.randomUUID()}_${file.filename}`;

    // Upload to S3
    await uploadObject(this.bucket, objectKey, file.buffer, file.mimetype);

    // Create artifact record in DB
    const artifact = await this.prisma.securityArtifact.create({
      data: {
        tenantId,
        vendorId,
        name: metadata.name,
        type: metadata.type as never,
        fileName: file.filename,
        fileSize: file.buffer.length,
        mimeType: file.mimetype,
        objectKey,
        bucketName: this.bucket,
        validFrom: metadata.validFrom ? new Date(metadata.validFrom) : null,
        validUntil: metadata.validUntil ? new Date(metadata.validUntil) : null,
        uploadedById: userId,
      },
    });

    return artifact;
  }

  /**
   * Get a presigned download URL for an artifact.
   */
  async getDownloadUrl(id: string, tenantId: string) {
    const artifact = await this.prisma.securityArtifact.findFirst({
      where: { id },
      include: {
        vendor: {
          select: { tenantId: true },
        },
      },
    });

    if (!artifact) throw new NotFoundError('SecurityArtifact', id);
    if (artifact.vendor.tenantId !== tenantId) {
      throw new NotFoundError('SecurityArtifact', id);
    }

    const url = await getPresignedDownloadUrl(
      this.bucket,
      artifact.objectKey,
      3600
    );

    return {
      url,
      fileName: artifact.fileName,
      mimeType: artifact.mimeType,
    };
  }

  /**
   * Update artifact metadata (name, validity dates).
   */
  async update(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      validFrom?: string;
      validUntil?: string;
    }
  ) {
    const artifact = await this.prisma.securityArtifact.findFirst({
      where: { id },
      include: {
        vendor: {
          select: { tenantId: true },
        },
      },
    });

    if (!artifact) throw new NotFoundError('SecurityArtifact', id);
    if (artifact.vendor.tenantId !== tenantId) {
      throw new NotFoundError('SecurityArtifact', id);
    }

    return this.prisma.securityArtifact.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.validFrom !== undefined
          ? { validFrom: data.validFrom ? new Date(data.validFrom) : null }
          : {}),
        ...(data.validUntil !== undefined
          ? { validUntil: data.validUntil ? new Date(data.validUntil) : null }
          : {}),
      },
    });
  }

  /**
   * Soft-delete an artifact: remove from DB and delete from S3.
   */
  async softDelete(id: string, tenantId: string) {
    const artifact = await this.prisma.securityArtifact.findFirst({
      where: { id },
      include: {
        vendor: {
          select: { tenantId: true },
        },
      },
    });

    if (!artifact) throw new NotFoundError('SecurityArtifact', id);
    if (artifact.vendor.tenantId !== tenantId) {
      throw new NotFoundError('SecurityArtifact', id);
    }

    // Delete from S3
    await deleteObject(this.bucket, artifact.objectKey);

    // Delete from DB
    await this.prisma.securityArtifact.delete({
      where: { id },
    });
  }
}
