const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware for HTTP routes
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
      }

      req.userId = decoded.userId;
      req.username = decoded.username;
      next();
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware for Socket.IO connections
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new Error('Authentication error: Token expired'));
        }
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    });

  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Internal server error'));
  }
};

// Optional middleware - allows both authenticated and unauthenticated access
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.userId = null;
      req.username = null;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        req.userId = null;
        req.username = null;
      } else {
        req.userId = decoded.userId;
        req.username = decoded.username;
      }
      next();
    });

  } catch (error) {
    console.error('Optional authentication error:', error);
    req.userId = null;
    req.username = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateSocket,
  optionalAuth
};