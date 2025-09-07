const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class SteganographyService {
  /**
   * Hide a message in an image using LSB steganography
   * @param {string} imageData - Base64 encoded image data or file path
   * @param {string} message - Message to hide
   * @returns {Promise<Object>} - Object containing the modified image data
   */
  static async hideMessage(imageData, message) {
    try {
      let imageBuffer;
      
      // Handle base64 encoded images
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (imageData.startsWith('/')) {
        // Handle file path
        imageBuffer = fs.readFileSync(imageData);
      } else {
        // Assume it's already a buffer or base64 string
        imageBuffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64');
      }

      // Convert to PNG format for consistent processing
      const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height, channels } = info;
      const pixelCount = width * height;
      const maxMessageLength = Math.floor(pixelCount * channels / 8) - 4; // Reserve 4 bytes for length

      if (message.length > maxMessageLength) {
        throw new Error(`Message too long. Maximum length: ${maxMessageLength} characters`);
      }

      // Create a copy of the image data
      const modifiedData = Buffer.from(data);

      // Convert message to binary with length prefix
      const messageWithLength = this.encodeMessageWithLength(message);
      const binaryMessage = this.stringToBinary(messageWithLength);

      // Hide the binary message in the LSBs
      let bitIndex = 0;
      for (let i = 0; i < modifiedData.length && bitIndex < binaryMessage.length; i++) {
        // Only modify RGB channels, preserve alpha channel for better quality
        if (channels === 4 && (i + 1) % 4 === 0) continue; // Skip alpha channel
        
        const bit = parseInt(binaryMessage[bitIndex]);
        modifiedData[i] = (modifiedData[i] & 0xFE) | bit; // Clear LSB and set new bit
        bitIndex++;
      }

      // Convert back to PNG
      const outputBuffer = await sharp(modifiedData, {
        raw: {
          width,
          height,
          channels
        }
      })
      .png()
      .toBuffer();

      // Convert to base64 for transmission
      const base64Output = `data:image/png;base64,${outputBuffer.toString('base64')}`;

      return {
        success: true,
        imageData: base64Output,
        originalSize: imageBuffer.length,
        modifiedSize: outputBuffer.length,
        messageLength: message.length
      };

    } catch (error) {
      console.error('Error hiding message:', error);
      throw new Error(`Steganography encoding failed: ${error.message}`);
    }
  }

  /**
   * Extract a hidden message from an image
   * @param {string} imageData - Base64 encoded image data or file path
   * @returns {Promise<string>} - The extracted message
   */
  static async extractMessage(imageData) {
    try {
      let imageBuffer;
      
      // Handle base64 encoded images
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (imageData.startsWith('/')) {
        // Handle file path
        imageBuffer = fs.readFileSync(imageData);
      } else {
        // Assume it's already a buffer or base64 string
        imageBuffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64');
      }

      // Convert to raw pixel data
      const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { channels } = info;

      // Extract LSBs to reconstruct the message
      let binaryData = '';
      
      for (let i = 0; i < data.length; i++) {
        // Skip alpha channel if present
        if (channels === 4 && (i + 1) % 4 === 0) continue;
        
        binaryData += (data[i] & 1).toString();
      }

      // First, extract the message length (first 32 bits)
      const lengthBinary = binaryData.substring(0, 32);
      const messageLength = parseInt(lengthBinary, 2);

      if (messageLength <= 0 || messageLength > 10000) {
        throw new Error('Invalid message length or no hidden message found');
      }

      // Extract the message bits
      const messageBinary = binaryData.substring(32, 32 + (messageLength * 8));
      
      if (messageBinary.length < messageLength * 8) {
        throw new Error('Incomplete message data');
      }

      // Convert binary to string
      const message = this.binaryToString(messageBinary);

      return message;

    } catch (error) {
      console.error('Error extracting message:', error);
      throw new Error(`Steganography decoding failed: ${error.message}`);
    }
  }

  /**
   * Encode message with length prefix
   * @param {string} message - Message to encode
   * @returns {string} - Message with 4-byte length prefix
   */
  static encodeMessageWithLength(message) {
    const length = message.length;
    const lengthBytes = Buffer.alloc(4);
    lengthBytes.writeUInt32BE(length, 0);
    
    return lengthBytes.toString('binary') + message;
  }

  /**
   * Convert string to binary representation
   * @param {string} str - String to convert
   * @returns {string} - Binary representation
   */
  static stringToBinary(str) {
    let binary = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      binary += charCode.toString(2).padStart(8, '0');
    }
    return binary;
  }

  /**
   * Convert binary representation to string
   * @param {string} binary - Binary string
   * @returns {string} - Converted string
   */
  static binaryToString(binary) {
    let result = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substring(i, i + 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        result += String.fromCharCode(charCode);
      }
    }
    return result;
  }

  /**
   * Validate image for steganography
   * @param {string} imageData - Base64 encoded image data
   * @returns {Promise<Object>} - Validation result
   */
  static async validateImage(imageData) {
    try {
      let imageBuffer;
      
      if (imageData.startsWith('data:image/')) {
        const base64Data = imageData.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = Buffer.from(imageData, 'base64');
      }

      const metadata = await sharp(imageBuffer).metadata();
      const pixelCount = metadata.width * metadata.height;
      const maxMessageLength = Math.floor(pixelCount * 3 / 8) - 4; // RGB channels only

      return {
        valid: true,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        maxMessageLength: maxMessageLength,
        pixelCount: pixelCount
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a test image with hidden message for demonstration
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {string} message - Message to hide
   * @returns {Promise<string>} - Base64 encoded image with hidden message
   */
  static async generateTestImage(width = 400, height = 300, message = 'Hello, this is a hidden message!') {
    try {
      // Create a simple gradient image
      const canvas = Buffer.alloc(width * height * 3);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 3;
          canvas[index] = Math.floor((x / width) * 255);     // Red
          canvas[index + 1] = Math.floor((y / height) * 255); // Green
          canvas[index + 2] = Math.floor(((x + y) / (width + height)) * 255); // Blue
        }
      }

      const imageBuffer = await sharp(canvas, {
        raw: {
          width,
          height,
          channels: 3
        }
      })
      .png()
      .toBuffer();

      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      
      // Hide the message in the generated image
      const result = await this.hideMessage(base64Image, message);
      
      return result.imageData;

    } catch (error) {
      console.error('Error generating test image:', error);
      throw new Error(`Test image generation failed: ${error.message}`);
    }
  }
}

module.exports = SteganographyService;