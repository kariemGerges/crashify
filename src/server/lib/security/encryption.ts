// =============================================
// FILE: server/lib/security/encryption.ts
// AES-256 Encryption Service (REQ-129)
// =============================================

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
}

// Type assertion after runtime check
const ENCRYPTION_KEY_STRING: string = ENCRYPTION_KEY;

const scryptAsync = promisify(scrypt);

/**
 * Derive encryption key from password using scrypt
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export async function encryptData(plaintext: string): Promise<string> {
    try {
        // Generate salt and IV
        const salt = randomBytes(SALT_LENGTH);
        const iv = randomBytes(IV_LENGTH);

        // Derive key from password and salt
        const key = await deriveKey(ENCRYPTION_KEY_STRING, salt);

        // Create cipher
        const cipher = createCipheriv(ALGORITHM, key, iv);

        // Encrypt data
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const tag = cipher.getAuthTag();

        // Combine salt, iv, tag, and encrypted data
        const combined = Buffer.concat([
            salt,
            iv,
            tag,
            Buffer.from(encrypted, 'hex'),
        ]);

        // Return as base64 for easy storage
        return combined.toString('base64');
    } catch (error) {
        throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export async function decryptData(encryptedData: string): Promise<string> {
    try {
        // Decode from base64
        const combined = Buffer.from(encryptedData, 'base64');

        // Extract components
        const salt = combined.subarray(0, SALT_LENGTH);
        const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = combined.subarray(
            SALT_LENGTH + IV_LENGTH,
            SALT_LENGTH + IV_LENGTH + TAG_LENGTH
        );
        const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

        // Derive key from password and salt
        const key = await deriveKey(ENCRYPTION_KEY_STRING, salt);

        // Create decipher
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // Decrypt data
        let decrypted = decipher.update(encrypted, undefined, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Encrypt phone number
 */
export async function encryptPhone(phone: string): Promise<string> {
    return encryptData(phone);
}

/**
 * Decrypt phone number
 */
export async function decryptPhone(encryptedPhone: string): Promise<string> {
    return decryptData(encryptedPhone);
}

/**
 * Encrypt address
 */
export async function encryptAddress(address: string): Promise<string> {
    return encryptData(address);
}

/**
 * Decrypt address
 */
export async function decryptAddress(encryptedAddress: string): Promise<string> {
    return decryptData(encryptedAddress);
}

/**
 * Encrypt any sensitive string data
 */
export async function encryptSensitiveData(data: string): Promise<string> {
    return encryptData(data);
}

/**
 * Decrypt any sensitive string data
 */
export async function decryptSensitiveData(encryptedData: string): Promise<string> {
    return decryptData(encryptedData);
}

