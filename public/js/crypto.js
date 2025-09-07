// AES-GCM helper utilities using Web Crypto API

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function deriveKeyFromPassphrase(passphrase, salt) {
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 200000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export function randomBytes(length) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

export function concatUint8(...chunks) {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, slice);
  }
  return btoa(binary);
}

export function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptText(plainText, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(plainText)
  );
  const bytes = new Uint8Array(cipherBuffer);
  const packed = concatUint8(salt, iv, bytes);
  return bytesToBase64(packed);
}

export async function decryptText(cipherB64, passphrase) {
  const packed = base64ToBytes(cipherB64);
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const data = packed.slice(28);
  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return textDecoder.decode(plainBuffer);
}

