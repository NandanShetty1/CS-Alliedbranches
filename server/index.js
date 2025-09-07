import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import { signToken, authMiddleware, socketAuthMiddleware } from './auth.js';
import { createUser, validateUser, findByUsername, sanitizeUser } from './userStore.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Static site
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Auth endpoints
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body || {};
    const user = await createUser({ username, password, displayName });
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await validateUser(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: 'Login failed' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const decoded = req.user;
  const user = await findByUsername(decoded.username);
  res.json({ user: sanitizeUser(user) });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1e7,
});

io.use(socketAuthMiddleware);

function getUsersInRoom(room) {
  const clients = io.sockets.adapter.rooms.get(room);
  if (!clients) return [];
  const users = [];
  for (const socketId of clients) {
    const s = io.sockets.sockets.get(socketId);
    if (s) {
      users.push({ id: s.id, displayName: s.data?.displayName || s.user?.displayName || 'Anonymous' });
    }
  }
  return users;
}

io.on('connection', (socket) => {
  socket.on('join', ({ room, displayName }) => {
    if (!room) return;
    socket.join(room);
    socket.data.room = room;
    socket.data.displayName = displayName || socket.user?.displayName || 'Anonymous';
    io.to(room).emit('system', { type: 'join', user: socket.data.displayName, at: Date.now() });
    io.to(room).emit('room_users', { users: getUsersInRoom(room) });
  });

  socket.on('message', (payload) => {
    const room = payload?.room || socket.data.room;
    if (!room) return;
    const outgoing = {
      ...payload,
      room,
      from: {
        id: socket.id,
        displayName: socket.data.displayName || 'Anonymous',
      },
      at: Date.now(),
    };
    io.to(room).emit('message', outgoing);
  });

  socket.on('typing', (isTyping) => {
    const room = socket.data.room;
    if (!room) return;
    socket.to(room).emit('typing', { user: socket.data.displayName, isTyping: !!isTyping });
  });

  socket.on('disconnecting', () => {
    const room = socket.data.room;
    if (room) {
      socket.to(room).emit('system', { type: 'leave', user: socket.data.displayName, at: Date.now() });
      setTimeout(() => {
        io.to(room).emit('room_users', { users: getUsersInRoom(room) });
      }, 0);
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

