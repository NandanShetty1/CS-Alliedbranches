const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Store active users and rooms
const activeUsers = new Map();
const rooms = new Map();

// Encryption utilities
const encryptMessage = (message, key) => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decryptMessage = (encryptedMessage, key) => {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
};

const setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected`);

    // Add user to active users
    activeUsers.set(socket.userId, {
      id: socket.userId,
      username: socket.username,
      socketId: socket.id,
      currentRoom: null,
      publicKey: null
    });

    // Send updated user list to all clients
    io.emit('users_updated', Array.from(activeUsers.values()));

    // Handle joining a room
    socket.on('join_room', (roomId) => {
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      // Update user's current room
      const user = activeUsers.get(socket.userId);
      if (user) {
        user.currentRoom = roomId;
        activeUsers.set(socket.userId, user);
      }

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Set(),
          messages: [],
          createdAt: new Date()
        });
      }

      const room = rooms.get(roomId);
      room.users.add(socket.userId);

      socket.emit('joined_room', { roomId, roomUsers: Array.from(room.users) });
      socket.to(roomId).emit('user_joined', { 
        userId: socket.userId, 
        username: socket.username 
      });

      // Send room history
      socket.emit('room_history', room.messages.slice(-50)); // Last 50 messages
    });

    // Handle leaving a room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      socket.currentRoom = null;

      const user = activeUsers.get(socket.userId);
      if (user) {
        user.currentRoom = null;
        activeUsers.set(socket.userId, user);
      }

      const room = rooms.get(roomId);
      if (room) {
        room.users.delete(socket.userId);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }

      socket.to(roomId).emit('user_left', { 
        userId: socket.userId, 
        username: socket.username 
      });
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      const { roomId, message, messageType = 'text', encryptionKey } = data;

      if (!roomId || !message) {
        socket.emit('error', { message: 'Room ID and message are required' });
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      let processedMessage = message;
      
      // Encrypt message if key provided
      if (encryptionKey) {
        try {
          processedMessage = encryptMessage(message, encryptionKey);
        } catch (error) {
          socket.emit('error', { message: 'Encryption failed' });
          return;
        }
      }

      const messageData = {
        id: crypto.randomUUID(),
        userId: socket.userId,
        username: socket.username,
        message: processedMessage,
        messageType,
        encrypted: !!encryptionKey,
        timestamp: new Date().toISOString(),
        roomId
      };

      // Store message in room history
      room.messages.push(messageData);
      
      // Keep only last 100 messages per room
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Broadcast message to room
      io.to(roomId).emit('new_message', messageData);
    });

    // Handle steganography messages
    socket.on('send_stego_message', (data) => {
      const { roomId, stegoImage, originalMessage, encryptionKey } = data;

      if (!roomId || !stegoImage) {
        socket.emit('error', { message: 'Room ID and stego image are required' });
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const messageData = {
        id: crypto.randomUUID(),
        userId: socket.userId,
        username: socket.username,
        message: originalMessage || 'Hidden message in image',
        messageType: 'steganography',
        stegoImage,
        encrypted: !!encryptionKey,
        timestamp: new Date().toISOString(),
        roomId
      };

      // Store message in room history
      room.messages.push(messageData);
      
      // Keep only last 100 messages per room
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }

      // Broadcast message to room
      io.to(roomId).emit('new_message', messageData);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected`);
      
      // Remove user from active users
      activeUsers.delete(socket.userId);
      
      // Remove user from current room
      if (socket.currentRoom) {
        const room = rooms.get(socket.currentRoom);
        if (room) {
          room.users.delete(socket.userId);
          if (room.users.size === 0) {
            rooms.delete(socket.currentRoom);
          } else {
            socket.to(socket.currentRoom).emit('user_left', {
              userId: socket.userId,
              username: socket.username
            });
          }
        }
      }

      // Send updated user list to all clients
      io.emit('users_updated', Array.from(activeUsers.values()));
    });
  });
};

module.exports = { setupSocketHandlers };