function textToBytes(text) {
	return new TextEncoder().encode(text);
}

function bytesToText(bytes) {
	return new TextDecoder().decode(bytes);
}

function writeBitsToData(data, bitArray) {
	for (let i = 0; i < bitArray.length; i++) {
		const byteIndex = i * 4;
		const channelIndex = byteIndex;
		const original = data[channelIndex];
		data[channelIndex] = (original & 0xFE) | (bitArray[i] & 1);
	}
}

function readBitsFromData(data, numBits) {
	const result = new Uint8Array(numBits);
	for (let i = 0; i < numBits; i++) {
		const byteIndex = i * 4;
		const channelIndex = byteIndex;
		result[i] = data[channelIndex] & 1;
	}
	return result;
}

function bytesToBits(bytes) {
	const bits = new Uint8Array(bytes.length * 8);
	for (let i = 0; i < bytes.length; i++) {
		for (let b = 0; b < 8; b++) {
			bits[i * 8 + (7 - b)] = (bytes[i] >> b) & 1;
		}
	}
	return bits;
}

function bitsToBytes(bits) {
	const bytes = new Uint8Array(bits.length / 8);
	for (let i = 0; i < bytes.length; i++) {
		let value = 0;
		for (let b = 0; b < 8; b++) {
			value = (value << 1) | (bits[i * 8 + b] & 1);
		}
		bytes[i] = value;
	}
	return bytes;
}

export async function encodeTextIntoPng(file, hiddenText) {
	const img = await readImageFromFile(file);
	const canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	const textBytes = textToBytes(hiddenText);
	const lenBytes = new Uint8Array(4);
	const len = textBytes.length;
	lenBytes[0] = (len >>> 24) & 0xff;
	lenBytes[1] = (len >>> 16) & 0xff;
	lenBytes[2] = (len >>> 8) & 0xff;
	lenBytes[3] = len & 0xff;
	const allBytes = new Uint8Array(lenBytes.length + textBytes.length);
	allBytes.set(lenBytes, 0);
	allBytes.set(textBytes, 4);
	const bits = bytesToBits(allBytes);

	const capacityBits = Math.floor(data.length / 4);
	if (bits.length > capacityBits) {
		throw new Error('Image too small to hide message');
	}

	writeBitsToData(data, bits);
	ctx.putImageData(imageData, 0, 0);
	return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

export async function decodeTextFromPng(file) {
	const img = await readImageFromFile(file);
	const canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	const lenBits = readBitsFromData(data, 32);
	const lenBytes = bitsToBytes(lenBits);
	const length = (lenBytes[0] << 24) | (lenBytes[1] << 16) | (lenBytes[2] << 8) | lenBytes[3];
	if (length <= 0 || length > 8 * 1024 * 1024) throw new Error('Invalid hidden message length');

	const totalBits = (4 + length) * 8;
	const bits = readBitsFromData(data, totalBits);
	const bytes = bitsToBytes(bits).slice(4);
	return bytesToText(bytes);
}

function readImageFromFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = reader.result;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}