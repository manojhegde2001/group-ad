import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET_NAME;
const publicUrl = process.env.AWS_S3_PUBLIC_URL;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({ region });
  }
  return client;
}

export function isS3Configured(): boolean {
  return Boolean(region && bucket && publicUrl && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export function getMissingS3Config(): string[] {
  const missing: string[] = [];
  if (!region) missing.push('AWS_REGION');
  if (!bucket) missing.push('AWS_S3_BUCKET_NAME');
  if (!publicUrl) missing.push('AWS_S3_PUBLIC_URL');
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
  return missing;
}

export async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return buildS3Url(key);
}

export function buildS3Url(key: string): string {
  return `${publicUrl}/${key}`;
}
