import 'server-only'
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const AUTH_TAG_LENGTH = 16

function getDerivedKey(): Buffer {
  const masterKey = process.env.SECRETS_MASTER_KEY
  if (!masterKey) {
    throw new Error('SECRETS_MASTER_KEY environment variable is not set')
  }
  return createHash('sha256').update(masterKey).digest()
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns base64-encoded encrypted data and IV.
 * The encrypted output includes the auth tag appended at the end (16 bytes).
 */
export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getDerivedKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encryptedBody = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Append auth tag to encrypted body
  const encryptedWithTag = Buffer.concat([encryptedBody, authTag])

  return {
    encrypted: encryptedWithTag.toString('base64'),
    iv: iv.toString('base64'),
  }
}

/**
 * Decrypts a base64-encoded AES-256-GCM encrypted string.
 * Expects the auth tag (16 bytes) to be appended at the end of the encrypted buffer.
 */
export function decrypt(encrypted: string, iv: string): string {
  const key = getDerivedKey()
  const ivBuffer = Buffer.from(iv, 'base64')
  const encryptedBuffer = Buffer.from(encrypted, 'base64')

  // Extract auth tag from the last 16 bytes
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - AUTH_TAG_LENGTH)
  const encryptedBody = encryptedBuffer.subarray(0, encryptedBuffer.length - AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encryptedBody), decipher.final()]).toString('utf8')
}
