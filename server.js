const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const { authenticateSocket } = require('./middleware/auth');
const SteganographyService = require('./services/steganography');
const EncryptionService = require('./services/encryption');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Store active users and rooms
const activeUsers = new Map();
const chatRooms = new Map();

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Store user info
  activeUsers.set(socket.id, {
    userId: socket.userId,
    username: socket.username,
    joinedAt: new Date()
  });

  // Join user to a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!chatRooms.has(roomId)) {
      chatRooms.set(roomId, {
        id: roomId,
        users: new Set(),
        messages: [],
        createdAt: new Date()
      });
    }
    
    const room = chatRooms.get(roomId);
    room.users.add(socket.userId);
    
    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });
    
    // Send recent messages to the user
    socket.emit('message-history', room.messages.slice(-50));
  });

  // Handle regular text messages
  socket.on('send-message', async (data) => {
    try {
      const { roomId, message, isEncrypted } = data;
      
      if (!roomId || !message) {
        socket.emit('error', 'Missing required fields');
        return;
      }

      const room = chatRooms.get(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      let processedMessage = message;
      
      // Encrypt message if requested
      if (isEncrypted) {
        processedMessage = EncryptionService.encrypt(message);
      }

      const messageData = {
        id: require('uuid').v4(),
        userId: socket.userId,
        username: socket.username,
        message: processedMessage,
        isEncrypted: isEncrypted || false,
        timestamp: new Date(),
        type: 'text'
      };

      room.messages.push(messageData);
      
      // Broadcast to all users in the room
      io.to(roomId).emit('new-message', messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle steganography messages
  socket.on('send-steganography', async (data) => {
    try {
      const { roomId, message, imageData, isEncrypted } = data;
      
      if (!roomId || !message || !imageData) {
        socket.emit('error', 'Missing required fields for steganography');
        return;
      }

      const room = chatRooms.get(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      let processedMessage = message;
      
      // Encrypt message if requested
      if (isEncrypted) {
        processedMessage = EncryptionService.encrypt(message);
      }

      // Hide message in image using steganography
      const steganographyResult = await SteganographyService.hideMessage(imageData, processedMessage);
      
      const messageData = {
        id: require('uuid').v4(),
        userId: socket.userId,
        username: socket.username,
        message: 'Hidden message in image',
        imageData: steganographyResult.imageData,
        hasHiddenMessage: true,
        isEncrypted: isEncrypted || false,
        timestamp: new Date(),
        type: 'steganography'
      };

      room.messages.push(messageData);
      
      // Broadcast to all users in the room
      io.to(roomId).emit('new-message', messageData);
      
    } catch (error) {
      console.error('Error sending steganography message:', error);
      socket.emit('error', 'Failed to send steganography message');
    }
  });

  // Handle steganography extraction
  socket.on('extract-message', async (data) => {
    try {
      const { imageData } = data;
      
      if (!imageData) {
        socket.emit('error', 'No image data provided');
        return;
      }

      const extractedMessage = await SteganographyService.extractMessage(imageData);
      
      let finalMessage = extractedMessage;
      
      // Try to decrypt if it looks like encrypted data
      try {
        if (extractedMessage.includes('U2FsdGVkX1')) { // CryptoJS encrypted format
          finalMessage = EncryptionService.decrypt(extractedMessage);
        }
      } catch (decryptError) {
        // If decryption fails, use original message
        console.log('Message was not encrypted or decryption failed');
      }
      
      socket.emit('message-extracted', {
        message: finalMessage,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error extracting message:', error);
      socket.emit('error', 'Failed to extract message from image');
    }
  });

  // Handle file upload for steganography
  socket.on('upload-image', (data) => {
    const { imageData, filename } = data;
    
    // Process the uploaded image
    socket.emit('image-uploaded', {
      success: true,
      imageData: imageData,
      filename: filename
    });
  });

  // Leave room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    
    const room = chatRooms.get(roomId);
    if (room) {
      room.users.delete(socket.userId);
      
      socket.to(roomId).emit('user-left', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date()
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    
    // Remove user from all rooms
    chatRooms.forEach((room, roomId) => {
      if (room.users.has(socket.userId)) {
        room.users.delete(socket.userId);
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      }
    });
    
    activeUsers.delete(socket.id);
  });
});

// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const room = chatRooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    userCount: room.users.size,
    messageCount: room.messages.length,
    createdAt: room.createdAt
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Secure Steganography Chat Server running on port ${PORT}`);
});

module.exports = { app, server, io };