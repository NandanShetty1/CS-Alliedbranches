const CryptoJS = require('crypto-js');
const crypto = require('crypto');

class EncryptionService {
  // Default encryption key (in production, use environment variable or user-provided key)
  static DEFAULT_KEY = process.env.ENCRYPTION_KEY || 'secure-chat-app-default-key-change-in-production';

  /**
   * Encrypt a message using AES encryption
   * @param {string} message - Message to encrypt
   * @param {string} key - Encryption key (optional, uses default if not provided)
   * @returns {string} - Encrypted message
   */
  static encrypt(message, key = this.DEFAULT_KEY) {
    try {
      if (!message) {
        throw new Error('Message cannot be empty');
      }

      // Use CryptoJS for AES encryption with PBKDF2
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        keySize: 256 / 32,
        ivSize: 128 / 32
      });

      return encrypted.toString();

    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a message using AES decryption
   * @param {string} encryptedMessage - Encrypted message to decrypt
   * @param {string} key - Decryption key (optional, uses default if not provided)
   * @returns {string} - Decrypted message
   */
  static decrypt(encryptedMessage, key = this.DEFAULT_KEY) {
    try {
      if (!encryptedMessage) {
        throw new Error('Encrypted message cannot be empty');
      }

      // Decrypt using CryptoJS
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        keySize: 256 / 32,
        ivSize: 128 / 32
      });

      const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedMessage) {
        throw new Error('Failed to decrypt message - invalid key or corrupted data');
      }

      return decryptedMessage;

    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a random encryption key
   * @param {number} length - Key length in bytes (default: 32 for AES-256)
   * @returns {string} - Random key in hex format
   */
  static generateKey(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      console.error('Key generation error:', error);
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a key from a password using PBKDF2
   * @param {string} password - User password
   * @param {string} salt - Salt for key derivation (optional)
   * @param {number} iterations - Number of iterations (default: 10000)
   * @returns {Object} - Object containing key and salt
   */
  static deriveKey(password, salt = null, iterations = 10000) {
    try {
      if (!password) {
        throw new Error('Password cannot be empty');
      }

      // Generate salt if not provided
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      
      // Derive key using PBKDF2
      const key = crypto.pbkdf2Sync(password, actualSalt, iterations, 32, 'sha256');
      
      return {
        key: key.toString('hex'),
        salt: actualSalt,
        iterations: iterations
      };

    } catch (error) {
      console.error('Key derivation error:', error);
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt message with user-provided password
   * @param {string} message - Message to encrypt
   * @param {string} password - User password
   * @returns {Object} - Object containing encrypted message and salt
   */
  static encryptWithPassword(message, password) {
    try {
      const keyData = this.deriveKey(password);
      const encrypted = this.encrypt(message, keyData.key);
      
      return {
        encrypted: encrypted,
        salt: keyData.salt,
        iterations: keyData.iterations
      };

    } catch (error) {
      console.error('Password encryption error:', error);
      throw new Error(`Password encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt message with user-provided password
   * @param {string} encryptedMessage - Encrypted message
   * @param {string} password - User password
   * @param {string} salt - Salt used during encryption
   * @param {number} iterations - Iterations used during encryption
   * @returns {string} - Decrypted message
   */
  static decryptWithPassword(encryptedMessage, password, salt, iterations = 10000) {
    try {
      const keyData = this.deriveKey(password, salt, iterations);
      return this.decrypt(encryptedMessage, keyData.key);

    } catch (error) {
      console.error('Password decryption error:', error);
      throw new Error(`Password decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash a message using SHA-256
   * @param {string} message - Message to hash
   * @returns {string} - SHA-256 hash
   */
  static hash(message) {
    try {
      return crypto.createHash('sha256').update(message).digest('hex');
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Generate HMAC for message integrity
   * @param {string} message - Message to generate HMAC for
   * @param {string} key - HMAC key
   * @returns {string} - HMAC digest
   */
  static generateHMAC(message, key) {
    try {
      return crypto.createHmac('sha256', key).update(message).digest('hex');
    } catch (error) {
      console.error('HMAC generation error:', error);
      throw new Error(`HMAC generation failed: ${error.message}`);
    }
  }

  /**
   * Verify HMAC for message integrity
   * @param {string} message - Original message
   * @param {string} hmac - HMAC to verify
   * @param {string} key - HMAC key
   * @returns {boolean} - True if HMAC is valid
   */
  static verifyHMAC(message, hmac, key) {
    try {
      const computedHMAC = this.generateHMAC(message, key);
      return crypto.timingSafeEqual(
        Buffer.from(hmac, 'hex'),
        Buffer.from(computedHMAC, 'hex')
      );
    } catch (error) {
      console.error('HMAC verification error:', error);
      return false;
    }
  }

  /**
   * Encrypt message with integrity check
   * @param {string} message - Message to encrypt
   * @param {string} key - Encryption key
   * @returns {Object} - Object containing encrypted message and HMAC
   */
  static encryptWithIntegrity(message, key = this.DEFAULT_KEY) {
    try {
      const encrypted = this.encrypt(message, key);
      const hmac = this.generateHMAC(encrypted, key);
      
      return {
        encrypted: encrypted,
        hmac: hmac,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Encryption with integrity error:', error);
      throw new Error(`Encryption with integrity failed: ${error.message}`);
    }
  }

  /**
   * Decrypt message with integrity check
   * @param {Object} encryptedData - Object containing encrypted message and HMAC
   * @param {string} key - Decryption key
   * @returns {string} - Decrypted message
   */
  static decryptWithIntegrity(encryptedData, key = this.DEFAULT_KEY) {
    try {
      const { encrypted, hmac } = encryptedData;
      
      // Verify integrity first
      if (!this.verifyHMAC(encrypted, hmac, key)) {
        throw new Error('Message integrity check failed');
      }
      
      return this.decrypt(encrypted, key);

    } catch (error) {
      console.error('Decryption with integrity error:', error);
      throw new Error(`Decryption with integrity failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} - Random token in hex format
   */
  static generateToken(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Test encryption and decryption functionality
   * @returns {Object} - Test results
   */
  static test() {
    try {
      const testMessage = 'Hello, this is a test message for encryption!';
      const testKey = this.generateKey();
      
      console.log('Testing encryption service...');
      
      // Test basic encryption/decryption
      const encrypted = this.encrypt(testMessage, testKey);
      const decrypted = this.decrypt(encrypted, testKey);
      
      const basicTest = decrypted === testMessage;
      
      // Test password-based encryption
      const passwordEncrypted = this.encryptWithPassword(testMessage, 'testpassword123');
      const passwordDecrypted = this.decryptWithPassword(
        passwordEncrypted.encrypted,
        'testpassword123',
        passwordEncrypted.salt,
        passwordEncrypted.iterations
      );
      
      const passwordTest = passwordDecrypted === testMessage;
      
      // Test integrity encryption
      const integrityEncrypted = this.encryptWithIntegrity(testMessage, testKey);
      const integrityDecrypted = this.decryptWithIntegrity(integrityEncrypted, testKey);
      
      const integrityTest = integrityDecrypted === testMessage;
      
      return {
        basicEncryption: basicTest,
        passwordEncryption: passwordTest,
        integrityEncryption: integrityTest,
        allTestsPassed: basicTest && passwordTest && integrityTest
      };

    } catch (error) {
      console.error('Encryption test error:', error);
      return {
        error: error.message,
        allTestsPassed: false
      };
    }
  }
}

module.exports = EncryptionService;