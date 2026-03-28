/**
 * Storage Service - Cloudflare R2 (S3-compatible)
 * Handles file upload, delete, and URL generation
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import crypto from 'crypto'

// R2 configuration from environment
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'inmodash-documents'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '' // e.g. https://pub-xxx.r2.dev
// Set R2_ENABLED=false in .env to force local storage (e.g. macOS SSL incompatibility)
const R2_FORCE_DISABLED = process.env.R2_ENABLED === 'false'

const isR2Configured = !R2_FORCE_DISABLED && !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)

let s3Client: S3Client | null = null

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })
  console.log('✅ Cloudflare R2 storage configured')
} else if (R2_FORCE_DISABLED) {
  console.log('ℹ️  Cloudflare R2 disabled (R2_ENABLED=false) — using local storage')
} else {
  console.warn('⚠️  Cloudflare R2 not configured — falling back to local storage')
}

/**
 * Generate a unique storage key for a file
 * Format: {userId}/{context}/{timestamp}-{random}-{filename}
 */
function generateStorageKey(userId: number, originalName: string, context?: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  const ext = path.extname(originalName)
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize
    .substring(0, 50) // limit length
  
  const prefix = context ? `${userId}/${context}` : `${userId}`
  return `${prefix}/${baseName}-${timestamp}-${random}${ext}`
}

/**
 * Upload a file buffer to R2
 * Falls back to local storage if R2 is not configured
 */
async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: number,
  context?: string // e.g. 'contracts/10', 'agency'
): Promise<{ url: string; key: string }> {
  const key = generateStorageKey(userId, originalName, context)

  if (s3Client && isR2Configured) {
    // Upload to R2
    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }))

    const url = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`

    return { url, key }
  }

  // Fallback: local storage
  const fs = await import('fs')
  const uploadsDir = path.join(__dirname, '../../uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // Flatten key for local storage (replace slashes with dashes)
  const localFilename = key.replace(/\//g, '-')
  const localPath = path.join(uploadsDir, localFilename)
  fs.writeFileSync(localPath, buffer)

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
  const url = `${backendUrl}/uploads/${localFilename}`

  return { url, key: localFilename }
}

/**
 * Delete a file from R2 (or local storage)
 */
async function deleteFile(key: string): Promise<void> {
  if (s3Client && isR2Configured) {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      }))
    } catch (err) {
      console.error('Error deleting file from R2:', err)
    }
    return
  }

  // Fallback: local delete
  try {
    const fs = await import('fs')
    const localPath = path.join(__dirname, '../../uploads', key)
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath)
    }
  } catch (err) {
    console.error('Error deleting local file:', err)
  }
}

/**
 * Check if R2 is properly configured
 */
function isConfigured(): boolean {
  return isR2Configured
}

export const storageService = {
  uploadFile,
  deleteFile,
  isConfigured,
  generateStorageKey,
}
