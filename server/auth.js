import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

export function signToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = decoded;
  next();
}

export function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Missing auth token'));
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Invalid auth token'));
  }
  socket.user = decoded;
  next();
}

