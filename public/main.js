import { encryptString, decryptString } from './crypto.js';
import { encodeTextIntoPng, decodeTextFromPng } from './stego.js';

const socket = io();

const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const passphraseInput = document.getElementById('passphraseInput');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const sendStegoBtn = document.getElementById('sendStegoBtn');
const imageInput = document.getElementById('imageInput');
const decodeInput = document.getElementById('decodeInput');
const decodedOutput = document.getElementById('decodedOutput');

let currentRoom = null;

function addMessageEl({ meta, bodyHtml }) {
	const wrap = document.createElement('div');
	wrap.className = 'message';
	const metaEl = document.createElement('div');
	metaEl.className = 'meta';
	metaEl.textContent = meta;
	const bodyEl = document.createElement('div');
	bodyEl.innerHTML = bodyHtml;
	wrap.appendChild(metaEl);
	wrap.appendChild(bodyEl);
	messagesDiv.appendChild(wrap);
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function joinRoom() {
	const room = roomInput.value.trim();
	if (!room) return;
	socket.emit('room:join', { room }, (resp) => {
		if (resp?.ok) {
			currentRoom = room;
			addMessageEl({ meta: 'system', bodyHtml: `Joined room <b>${escapeHtml(room)}</b>` });
		} else {
			alert('Failed to join room');
		}
	});
}

function escapeHtml(text) {
	return text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

async function sendMessage() {
	if (!currentRoom) return alert('Join a room first');
	const passphrase = passphraseInput.value;
	if (!passphrase) return alert('Enter a passphrase for E2EE');
	const plain = messageInput.value.trim();
	if (!plain) return;
	const encrypted = await encryptString(plain, passphrase);
	socket.emit('chat:message', { type: 'text', content: encrypted }, (resp) => {
		if (!resp?.ok) return alert('Send failed');
		addMessageEl({ meta: 'me', bodyHtml: escapeHtml(plain) });
		messageInput.value = '';
	});
}

socket.on('chat:message', async (message) => {
	const passphrase = passphraseInput.value;
	if (!passphrase) return;
	try {
		if (message.type === 'text') {
			const decrypted = await decryptString(message.content, passphrase);
			addMessageEl({ meta: new Date(message.ts).toLocaleTimeString(), bodyHtml: escapeHtml(decrypted) });
		} else if (message.type === 'imageStego') {
			const img = document.createElement('img');
			img.src = 'data:image/png;base64,' + message.content;
			img.style.maxWidth = '320px';
			addMessageEl({ meta: new Date(message.ts).toLocaleTimeString(), bodyHtml: img.outerHTML });
		}
	} catch (e) {
		addMessageEl({ meta: 'error', bodyHtml: 'Failed to decrypt or render message' });
	}
});

joinBtn.addEventListener('click', joinRoom);
sendBtn.addEventListener('click', () => { sendMessage(); });
messageInput.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
		sendMessage();
	}
});

sendStegoBtn.addEventListener('click', async () => {
	if (!currentRoom) return alert('Join a room first');
	const passphrase = passphraseInput.value;
	if (!passphrase) return alert('Enter a passphrase for E2EE');
	const plain = messageInput.value.trim();
	if (!plain) return alert('Enter message to hide');
	const file = imageInput.files?.[0];
	if (!file) return alert('Choose a PNG/JPEG as cover image');
	try {
		const encrypted = await encryptString(plain, passphrase);
		const blob = await encodeTextIntoPng(file, encrypted);
		const arrayBuf = await blob.arrayBuffer();
		const b64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
		socket.emit('chat:message', { type: 'imageStego', content: b64, meta: { mime: 'image/png' } }, (resp) => {
			if (!resp?.ok) return alert('Send failed');
			const imgUrl = URL.createObjectURL(blob);
			const img = document.createElement('img');
			img.src = imgUrl;
			img.style.maxWidth = '320px';
			addMessageEl({ meta: 'me', bodyHtml: img.outerHTML });
			messageInput.value = '';
		});
	} catch (err) {
		alert('Stego encode failed: ' + err.message);
	}
});

decodeInput.addEventListener('change', async () => {
	const passphrase = passphraseInput.value;
	if (!passphrase) return alert('Enter the passphrase used to hide');
	const file = decodeInput.files?.[0];
	if (!file) return;
	try {
		const hiddenText = await decodeTextFromPng(file);
		const decrypted = await decryptString(hiddenText, passphrase);
		decodedOutput.textContent = decrypted;
	} catch (err) {
		decodedOutput.textContent = 'Failed to decode/decrypt: ' + err.message;
	}
});