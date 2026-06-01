import { promises as fs } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const R2_KEYS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'] as const
const r2Enabled = () => R2_KEYS.every(k => !!process.env[k])

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; status: 400; error: string }

export const uploadFile = async (file: File | null | undefined): Promise<UploadResult> => {
  if (!file || typeof (file as unknown) === 'string') {
    return { ok: false, status: 400, error: 'Archivo requerido en campo "receipt"' }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, status: 400, error: `Tipo no permitido (${file.type}). Solo JPEG, PNG, WebP.` }
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, status: 400, error: `Archivo demasiado grande (${file.size} bytes). Máximo 5 MB.` }
  }

  const ext = extname(file.name) || `.${(file.type.split('/')[1] ?? 'bin').toLowerCase()}`
  const key = `${randomUUID()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  if (r2Enabled()) {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
      }
    })
    await client.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         key,
      Body:        buffer,
      ContentType: file.type
    }))
    const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')
    return { ok: true, url: `${base}/${key}` }
  }

  const dir = join(process.cwd(), 'uploads')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(join(dir, key), buffer)
  return { ok: true, url: `/uploads/${key}` }
}
