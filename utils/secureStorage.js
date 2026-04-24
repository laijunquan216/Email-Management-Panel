const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const normalizeKey = () => {
  const raw = process.env.DATA_ENCRYPTION_KEY;

  if (raw) {
    try {
      const maybeBase64 = Buffer.from(raw, 'base64');
      if (maybeBase64.length === 32 && maybeBase64.toString('base64') === raw) {
        return maybeBase64;
      }
    } catch (_err) {
      // ignore and fallback to utf8 hash
    }

    return crypto.createHash('sha256').update(raw).digest();
  }

  const fallback = process.env.WEBUI_PASSWORD || 'email-panel-default-key';
  logger.warn('DATA_ENCRYPTION_KEY is not set. Falling back to WEBUI_PASSWORD-derived key.');
  return crypto.createHash('sha256').update(`fallback:${fallback}`).digest();
};

const ENCRYPTION_KEY = normalizeKey();

const encryptText = (plainText = '') => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decryptText = (cipherText = '') => {
  if (!cipherText) return '';

  const payload = Buffer.from(cipherText, 'base64');
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = payload.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = {
  encryptText,
  decryptText,
};
