export async function deriveKeyFromPassphrase(passphrase, saltBytes) {
	const enc = new TextEncoder();
	const baseKey = await crypto.subtle.importKey(
		'raw',
		enc.encode(passphrase),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);
	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: saltBytes,
			iterations: 120000,
			hash: 'SHA-256'
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export async function encryptString(message, passphrase) {
	const enc = new TextEncoder();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await deriveKeyFromPassphrase(passphrase, salt);
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(message));
	const payload = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
	payload.set(salt, 0);
	payload.set(iv, salt.length);
	payload.set(new Uint8Array(ciphertext), salt.length + iv.length);
	return base64Encode(payload);
}

export async function decryptString(payloadB64, passphrase) {
	const bytes = base64Decode(payloadB64);
	if (bytes.length < 28) throw new Error('Invalid payload');
	const salt = bytes.slice(0, 16);
	const iv = bytes.slice(16, 28);
	const cipherBytes = bytes.slice(28);
	const key = await deriveKeyFromPassphrase(passphrase, salt);
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
	return new TextDecoder().decode(plain);
}

export function base64Encode(bytes) {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

export function base64Decode(b64) {
	const binary = atob(b64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}