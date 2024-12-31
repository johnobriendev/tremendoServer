// utils/encryption.js
const crypto = require('crypto');

// Configuration
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'your-development-key', 'salt', 32);

// Encryption function
const encrypt = (text) => {
  if (!text) return text; // Handle null/undefined
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

// Decryption function
const decrypt = (text) => {
  if (!text) return text; // Handle null/undefined
  try {
    const [ivHex, encryptedText] = text.split(':');
    if (!ivHex || !encryptedText) return text; // Return original if not encrypted
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original text if decryption fails
  }
};

module.exports = { encrypt, decrypt };