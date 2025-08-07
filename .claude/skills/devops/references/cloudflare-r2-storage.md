# Cloudflare R2 Storage

S3-compatible object storage with zero egress fees.

## Quick Start

### Create Bucket
```bash
wrangler r2 bucket create my-bucket
wrangler r2 bucket create my-bucket --location=wnam
```

Locations: `wnam`, `enam`, `weur`, `eeur`, `apac`

### Upload Object
```bash
wrangler r2 object put my-bucket/file.txt --file=./local-file.txt
```

### Workers Binding

**wrangler.toml:**
```toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
```

**Worker:**
```typescript
// Put
await env.MY_BUCKET.put('user-uploads/photo.jpg', imageData, {
  httpMetadata: {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000'
  },
  customMetadata: {
    uploadedBy: userId,
    uploadDate: new Date().toISOString()
  }
});

// Get
const object = await env.MY_BUCKET.get('large-file.mp4');
if (!object) {
  return new Response('Not found', { status: 404 });
}

return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata.contentType,
    'ETag': object.etag
  }
});

// List
const listed = await env.MY_BUCKET.list({
  prefix: 'user-uploads/',
  limit: 100
});

// Delete
await env.MY_BUCKET.delete('old-file.txt');

// Head (check existence)
const object = await env.MY_BUCKET.head('file.txt');
if (object) {
  console.log('Size:', object.size);
}
```

## S3 API Integration

### AWS CLI
```bash
# Configure
aws configure
# Access Key ID: <your-key-id>
# Secret Access Key: <your-secret>
# Region: auto

# Operations
aws s3api list-buckets --endpoint-url https://<accountid>.r2.cloudflarestorage.com

aws s3 cp file.txt s3://my-bucket/ --endpoint-url https://<accountid>.r2.cloudflarestorage.com

# Presigned URL
aws s3 presign s3://my-bucket/file.txt --endpoint-url https://<accountid>.r2.cloudflarestorage.com --expires-in 3600
```

### JavaScript (AWS SDK v3)
```javascript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "file.txt",
  Body: fileContents
}));
```

### Python (Boto3)
```python
import boto3

s3 = boto3.client(
    service_name='s3',
    endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
    aws_access_key_id=access_key_id,
    aws_secret_access_key=secret_access_key,
    region_name='auto'
)

s3.upload_fileobj(file_obj, 'my-bucket', 'file.txt')
s3.download_file('my-bucket', 'file.txt', './local-file.txt')
```

## Multipart Uploads

For files >100MB:

```typescript
const multipart = await env.MY_BUCKET.createMultipartUpload('large-file.mp4');

// Upload parts (5MiB - 5GiB each, max 10,000 parts)
const part1 = await multipart.uploadPart(1, chunk1);
const part2 = await multipart.uploadPart(2, chunk2);

// Complete
const object = await multipart.complete([part1, part2]);
```
