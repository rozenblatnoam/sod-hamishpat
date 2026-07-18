import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ALLOWED = new Set([
  'avida.mp4', 'cadkatan.mp4', 'aval.mp4',
  'korkinet.mp4', 'masmer.mp4', 'revach.mp4',
]);

@Controller('videos')
export class VideosController {
  private s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  @Get('signed/:filename')
  @UseGuards(JwtAuthGuard)
  async getSignedUrl(@Param('filename') filename: string) {
    if (!ALLOWED.has(filename)) return { error: 'not found' };
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: filename }),
      { expiresIn: 7200 },
    );
    return { url };
  }
}
