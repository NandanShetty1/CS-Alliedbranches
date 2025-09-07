// Simple LSB steganography for PNG/JPEG via Canvas
// Encodes ciphertext (base64) into the least significant bit of pixel channels
// Note: This is a basic educational implementation and not resistant to recompression

function stringToBytes(str) {
  const enc = new TextEncoder();
  return enc.encode(str);
}

function bytesToString(bytes) {
  const dec = new TextDecoder();
  return dec.decode(bytes);
}

function setBit(byte, bitIndex, bit) {
  if (bit) return byte | (1 << bitIndex);
  return byte & ~(1 << bitIndex);
}

export async function encodeStego(imageFile, messageString) {
  const imageBitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // RGBA

  const messageBytes = stringToBytes(messageString);
  const lengthBytes = new Uint8Array(4);
  const dv = new DataView(lengthBytes.buffer);
  dv.setUint32(0, messageBytes.length, false);
  const payload = new Uint8Array(lengthBytes.length + messageBytes.length);
  payload.set(lengthBytes, 0);
  payload.set(messageBytes, lengthBytes.length);

  const capacityBits = data.length; // 1 bit per channel (LSB)
  const requiredBits = payload.length * 8;
  if (requiredBits > capacityBits) {
    throw new Error('Image too small for message');
  }

  let bitIndex = 0;
  for (let i = 0; i < payload.length; i++) {
    for (let b = 7; b >= 0; b--) {
      const bit = (payload[i] >> b) & 1;
      const channelIndex = bitIndex; // use LSB of each channel
      data[channelIndex] = setBit(data[channelIndex], 0, bit);
      bitIndex++;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob;
}

export async function decodeStego(imageFile) {
  const imageBitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  function readBits(numBits, startBit) {
    const bytes = new Uint8Array(Math.ceil(numBits / 8));
    let bitPtr = startBit;
    for (let i = 0; i < numBits; i++) {
      const bit = data[bitPtr] & 1;
      const byteIndex = Math.floor(i / 8);
      const shift = 7 - (i % 8);
      bytes[byteIndex] |= bit << shift;
      bitPtr++;
    }
    return { bytes, next: bitPtr };
  }

  const { bytes: lengthBytes, next } = readBits(32, 0);
  const dv = new DataView(lengthBytes.buffer);
  const messageLength = dv.getUint32(0, false);
  const { bytes: msgBytes } = readBits(messageLength * 8, next);
  return bytesToString(msgBytes);
}

