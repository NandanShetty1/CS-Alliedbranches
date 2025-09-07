/* eslint-disable no-console */
require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || undefined;

const app = express();

app.use(helmet({
	contentSecurityPolicy: {
		useDefaults: true,
		directives: {
			"default-src": ["'self'"],
			"script-src": ["'self'"],
			"style-src": ["'self'", "'unsafe-inline'"],
			"img-src": ["'self'", "data:"],
			"connect-src": ["'self'", "ws:", "wss:"],
			"object-src": ["'none'"],
		}
	},
	crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors(ALLOW_ORIGIN ? { origin: ALLOW_ORIGIN } : {}));

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, { maxAge: '1h', etag: true }));

app.get('/', (_req, res) => {
	res.sendFile(path.join(publicDir, 'index.html'));
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
	cors: ALLOW_ORIGIN ? { origin: ALLOW_ORIGIN } : undefined,
	maxHttpBufferSize: 1e7
});

function sanitizeRoom(room) {
	if (typeof room !== 'string') return null;
	const trimmed = room.trim();
	if (!/^[-a-zA-Z0-9_.:@]{1,64}$/.test(trimmed)) return null;
	return trimmed;
}

io.on('connection', (socket) => {
	let currentRoom = null;

	socket.on('room:join', (payload, ack) => {
		try {
			const room = sanitizeRoom(payload?.room);
			if (!room) {
				ack && ack({ ok: false, error: 'INVALID_ROOM' });
				return;
			}
			if (currentRoom) {
				socket.leave(currentRoom);
			}
			socket.join(room);
			currentRoom = room;
			ack && ack({ ok: true, room });
		} catch (err) {
			ack && ack({ ok: false, error: 'JOIN_FAILED' });
		}
	});

	socket.on('chat:message', (payload, ack) => {
		try {
			if (!currentRoom) {
				ack && ack({ ok: false, error: 'NOT_IN_ROOM' });
				return;
			}
			const type = payload?.type;
			const content = payload?.content;
			if (typeof content !== 'string' || content.length === 0) {
				ack && ack({ ok: false, error: 'INVALID_CONTENT' });
				return;
			}
			if (content.length > 8 * 1024 * 1024) {
				ack && ack({ ok: false, error: 'CONTENT_TOO_LARGE' });
				return;
			}
			const message = {
				room: currentRoom,
				type: type === 'imageStego' ? 'imageStego' : 'text',
				content,
				meta: payload?.meta || null,
				from: socket.id,
				ts: Date.now()
			};
			socket.to(currentRoom).emit('chat:message', message);
			ack && ack({ ok: true });
		} catch (err) {
			ack && ack({ ok: false, error: 'SEND_FAILED' });
		}
	});

	socket.on('disconnect', () => {
		currentRoom = null;
	});

	socket.on('room:typing', (isTyping) => {
		if (currentRoom) {
			socket.to(currentRoom).emit('room:typing', { from: socket.id, isTyping: Boolean(isTyping) });
		}
	});
});

httpServer.listen(PORT, () => {
	console.log(`Secure Stego Chat listening on http://localhost:${PORT}`);
});