import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TrustDocumentCategory } from '@prisma/client';

export class UploadTrustDocumentDto {
  @ApiProperty({
    description: 'Organization ID that owns the document',
    example: 'org_6914cd0e16e4c7dccbb54426',
  })
  @IsString()
  organizationId!: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'security-overview.pdf',
  })
  @IsString()
  fileName!: string;

  @ApiPropertyOptional({
    description: 'MIME type (optional)',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiProperty({
    description: 'Base64-encoded file contents (no data URL prefix)',
  })
  @IsString()
  fileData!: string;

  @ApiPropertyOptional({
    description: 'Optional description shown in the trust portal',
    example: 'Overview of our security program',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Document category: general, oipc_report, custodian_document, privacy_impact_assessment, threat_risk_assessment, penetration_test_report, compliance_certificate',
    example: 'general',
    enum: TrustDocumentCategory,
  })
  @IsOptional()
  @IsEnum(TrustDocumentCategory)
  category?: TrustDocumentCategory;
}

export class TrustDocumentResponseDto {
  @ApiProperty({ example: 'tdoc_abc123' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'security-overview.pdf' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Overview of our security program' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: '2026-01-02T10:15:00.000Z' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ example: '2026-01-02T10:15:00.000Z' })
  @IsString()
  updatedAt!: string;
}

export class TrustDocumentSignedUrlDto {
  @ApiProperty({
    description: 'Organization ID that owns the document',
    example: 'org_6914cd0e16e4c7dccbb54426',
  })
  @IsString()
  organizationId!: string;
}

export class TrustDocumentUrlResponseDto {
  @ApiProperty()
  @IsString()
  signedUrl!: string;

  @ApiProperty()
  @IsString()
  fileName!: string;
}

export class DeleteTrustDocumentDto {
  @ApiProperty({
    description: 'Organization ID that owns the document',
    example: 'org_6914cd0e16e4c7dccbb54426',
  })
  @IsString()
  organizationId!: string;
}
