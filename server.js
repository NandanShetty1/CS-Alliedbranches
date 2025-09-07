const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// In-memory storage for demo (in production, use a database)
const users = new Map();
const rooms = new Map();
const messages = new Map();

// Steganography utilities
class Steganography {
  static async hideMessageInImage(imagePath, message, outputPath) {
    try {
      const imageBuffer = await sharp(imagePath).raw().toBuffer();
      const metadata = await sharp(imagePath).metadata();
      
      // Convert message to binary
      const messageBinary = this.textToBinary(message + '\0'); // \0 as end marker
      const messageLength = messageBinary.length;
      
      // Check if image can hold the message
      const maxCapacity = (metadata.width * metadata.height * 3) / 8; // 3 channels, 8 bits per byte
      if (messageLength > maxCapacity) {
        throw new Error('Message too long for image capacity');
      }
      
      let messageIndex = 0;
      const newImageBuffer = Buffer.from(imageBuffer);
      
      // Hide message in LSB of each channel
      for (let i = 0; i < newImageBuffer.length && messageIndex < messageLength; i++) {
        if (messageIndex < messageLength) {
          // Clear LSB and set to message bit
          newImageBuffer[i] = (newImageBuffer[i] & 0xFE) | parseInt(messageBinary[messageIndex]);
          messageIndex++;
        }
      }
      
      // Save the steganographic image
      await sharp(newImageBuffer, {
        raw: {
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels
        }
      }).png().toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Steganography error: ${error.message}`);
    }
  }
  
  static async extractMessageFromImage(imagePath) {
    try {
      const imageBuffer = await sharp(imagePath).raw().toBuffer();
      const metadata = await sharp(imagePath).metadata();
      
      let extractedBits = '';
      let message = '';
      
      // Extract LSB from each channel
      for (let i = 0; i < imageBuffer.length; i++) {
        extractedBits += (imageBuffer[i] & 1).toString();
        
        // Check for complete byte (8 bits)
        if (extractedBits.length === 8) {
          const byte = parseInt(extractedBits, 2);
          if (byte === 0) { // End marker found
            break;
          }
          message += String.fromCharCode(byte);
          extractedBits = '';
        }
      }
      
      return message;
    } catch (error) {
      throw new Error(`Steganography extraction error: ${error.message}`);
    }
  }
  
  static textToBinary(text) {
    return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  }
}

// Encryption utilities
class Encryption {
  static generateKey() {
    return crypto.randomBytes(32);
  }
  
  static encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  static decrypt(encryptedText, key) {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      username,
      password: hashedPassword,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    users.set(username, user);
    
    const token = jwt.sign({ username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { username, id: user.id } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = users.get(username);
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { username, id: user.id } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    res.json({ 
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/api/hide-message', authenticateToken, async (req, res) => {
  try {
    const { imagePath, message } = req.body;
    
    if (!imagePath || !message) {
      return res.status(400).json({ error: 'Image path and message required' });
    }
    
    const fullImagePath = path.join(uploadsDir, imagePath);
    const outputPath = path.join(uploadsDir, 'stego-' + imagePath);
    
    await Steganography.hideMessageInImage(fullImagePath, message, outputPath);
    
    res.json({ 
      success: true,
      stegoImagePath: 'stego-' + imagePath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/extract-message', authenticateToken, async (req, res) => {
  try {
    const { imagePath } = req.body;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Image path required' });
    }
    
    const fullImagePath = path.join(uploadsDir, imagePath);
    const message = await Steganography.extractMessageFromImage(fullImagePath);
    
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (data) => {
    const { room, username } = data;
    socket.join(room);
    socket.username = username;
    socket.room = room;
    
    // Notify others in the room
    socket.to(room).emit('user-joined', { username, timestamp: new Date() });
    
    // Send room history
    if (messages.has(room)) {
      socket.emit('room-history', messages.get(room));
    }
  });
  
  socket.on('send-message', (data) => {
    const { message, type = 'text', encrypted = false } = data;
    const messageData = {
      id: crypto.randomUUID(),
      username: socket.username,
      message,
      type,
      encrypted,
      timestamp: new Date(),
      room: socket.room
    };
    
    // Store message
    if (!messages.has(socket.room)) {
      messages.set(socket.room, []);
    }
    messages.get(socket.room).push(messageData);
    
    // Broadcast to room
    io.to(socket.room).emit('new-message', messageData);
  });
  
  socket.on('disconnect', () => {
    if (socket.username && socket.room) {
      socket.to(socket.room).emit('user-left', { 
        username: socket.username, 
        timestamp: new Date() 
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});