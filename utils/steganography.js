const sharp = require('sharp');
const crypto = require('crypto');

class Steganography {
  constructor() {
    this.delimiter = 'STEGO_END';
  }

  // Convert text to binary
  textToBinary(text) {
    return text.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
  }

  // Convert binary to text
  binaryToText(binary) {
    const chunks = binary.match(/.{1,8}/g) || [];
    return chunks.map(chunk => String.fromCharCode(parseInt(chunk, 2))).join('');
  }

  // Hide message in image using LSB (Least Significant Bit) steganography
  async hideMessage(imageBuffer, message) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const binaryMessage = this.textToBinary(message + this.delimiter);
      const messageLength = binaryMessage.length;
      
      // Check if image can hold the message
      const maxCapacity = (data.length / 4) * 3; // 3 bits per pixel (RGB)
      if (messageLength > maxCapacity) {
        throw new Error('Message too long for this image');
      }

      let messageIndex = 0;
      const newData = Buffer.from(data);

      for (let i = 0; i < data.length && messageIndex < messageLength; i += 4) {
        // Process RGB channels (skip alpha if present)
        for (let channel = 0; channel < 3 && messageIndex < messageLength; channel++) {
          const pixelIndex = i + channel;
          if (pixelIndex < data.length) {
            // Clear LSB and set it to message bit
            newData[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(binaryMessage[messageIndex]);
            messageIndex++;
          }
        }
      }

      // Create new image with hidden message
      const result = await sharp(newData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels
        }
      })
      .png()
      .toBuffer();

      return result;
    } catch (error) {
      throw new Error(`Steganography error: ${error.message}`);
    }
  }

  // Extract message from image
  async extractMessage(imageBuffer) {
    try {
      const { data } = await sharp(imageBuffer)
        .raw()
        .toBuffer();

      let binaryMessage = '';
      let extractedText = '';
      let foundDelimiter = false;

      for (let i = 0; i < data.length; i += 4) {
        // Extract LSB from RGB channels
        for (let channel = 0; channel < 3; channel++) {
          const pixelIndex = i + channel;
          if (pixelIndex < data.length) {
            binaryMessage += data[pixelIndex] & 1;
            
            // Check for delimiter every 8 bits
            if (binaryMessage.length % 8 === 0) {
              const chunk = binaryMessage.slice(-8);
              const char = String.fromCharCode(parseInt(chunk, 2));
              extractedText += char;
              
              if (extractedText.endsWith(this.delimiter)) {
                foundDelimiter = true;
                break;
              }
            }
          }
        }
        if (foundDelimiter) break;
      }

      if (!foundDelimiter) {
        throw new Error('No hidden message found or message corrupted');
      }

      // Remove delimiter and convert to text
      const message = extractedText.slice(0, -this.delimiter.length);
      return this.binaryToText(this.textToBinary(message));
    } catch (error) {
      throw new Error(`Extraction error: ${error.message}`);
    }
  }

  // Encrypt message before hiding
  encryptMessage(message, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt message after extraction
  decryptMessage(encryptedMessage, key) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
  }
}

module.exports = new Steganography();