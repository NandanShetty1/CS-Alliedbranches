# Secure Real-Time Chat Application with Steganography

A modern, secure web-based chat application that combines real-time messaging with steganography capabilities. Users can send encrypted messages and hide secret messages within images using advanced steganography techniques.

## 🚀 Features

### Core Functionality
- **Real-time Messaging**: Instant messaging using Socket.IO
- **User Authentication**: Secure JWT-based authentication system
- **Multiple Users**: Support for multiple concurrent users
- **Room-based Chat**: Organized chat rooms for different conversations

### Security Features
- **End-to-End Encryption**: AES-256-CBC encryption for all messages
- **Steganography**: Hide secret messages within images using LSB (Least Significant Bit) technique
- **Secure Authentication**: Password hashing with bcrypt
- **Rate Limiting**: Protection against spam and abuse
- **Input Validation**: Comprehensive input sanitization

### Advanced Features
- **Image Steganography**: Hide and extract messages from images
- **Encrypted Steganography**: Combine encryption with steganography for maximum security
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Typing Indicators**: Real-time typing status
- **Message History**: Persistent message storage per room
- **File Upload**: Secure image upload and processing

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Sharp** - Image processing
- **Multer** - File upload handling
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **React Dropzone** - File upload interface
- **Crypto-JS** - Client-side encryption

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-chat-steganography
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

   Update the following variables in `.env`:
   ```
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Start the server
   npm start
   
   # In a new terminal, start the client
   cd client
   npm start
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - The server will be running on `http://localhost:5000`

## 🔧 Development

### Available Scripts

#### Server Scripts
- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon

#### Client Scripts
- `npm start` - Start the React development server
- `npm run build` - Build the React app for production
- `npm test` - Run the test suite

### Project Structure
```
secure-chat-steganography/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── routes/                 # Express routes
│   ├── auth.js           # Authentication routes
│   └── steganography.js  # Steganography API routes
├── middleware/            # Express middleware
│   └── auth.js           # JWT authentication
├── socket/               # Socket.IO handlers
│   └── socketHandlers.js # Real-time chat logic
├── utils/                # Utility functions
│   └── steganography.js  # Steganography implementation
├── server.js             # Main server file
├── package.json
└── README.md
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Password hashing using bcrypt with salt rounds
- Protected API endpoints with middleware
- Secure session management

### Encryption
- AES-256-CBC encryption for all messages
- Client-side encryption/decryption
- Configurable encryption keys per user
- Secure key management

### Steganography
- LSB (Least Significant Bit) steganography
- Support for PNG, JPG, and other image formats
- Capacity checking before hiding messages
- Error handling for corrupted or invalid images

### Input Validation & Sanitization
- Comprehensive input validation
- File type and size restrictions
- XSS protection
- SQL injection prevention

## 🎯 Usage

### Basic Chat
1. **Register/Login**: Create an account or login with existing credentials
2. **Join Room**: Automatically join the general chat room
3. **Send Messages**: Type and send messages in real-time
4. **Enable Encryption**: Toggle encryption in settings and set a key

### Steganography
1. **Open Steganography Modal**: Click the image icon in the message input
2. **Select Image**: Upload or drag & drop an image
3. **Enter Message**: Type your secret message
4. **Hide Message**: Click "Hide Message" to embed the message in the image
5. **Extract Message**: Use "Extract Message" to retrieve hidden messages

### Advanced Features
- **User List**: View all online users
- **Settings**: Configure encryption and other options
- **Message History**: View previous messages in the room
- **Typing Indicators**: See when others are typing

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Steganography
- `POST /api/steganography/hide` - Hide message in image
- `POST /api/steganography/extract` - Extract message from image
- `POST /api/steganography/info` - Get image capacity info

### WebSocket Events
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a text message
- `send_stego_message` - Send a steganography message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

## 🚀 Deployment

### Production Build
```bash
# Build the React app
cd client
npm run build
cd ..

# Start the production server
NODE_ENV=production npm start
```

### Environment Variables for Production
```
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing
1. **Authentication**: Test user registration and login
2. **Real-time Chat**: Test message sending and receiving
3. **Encryption**: Test encrypted messaging
4. **Steganography**: Test hiding and extracting messages
5. **File Upload**: Test image upload and processing

### Security Testing
- Test with invalid tokens
- Test with malformed requests
- Test file upload restrictions
- Test rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

This application is designed for educational and demonstration purposes. For production use, consider:

- Using a proper database instead of in-memory storage
- Implementing additional security measures
- Regular security audits
- Proper key management
- HTTPS in production
- Rate limiting and DDoS protection

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Module Not Found**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **CORS Issues**
   - Ensure the client is running on port 3000
   - Check CORS configuration in server.js

4. **Image Upload Issues**
   - Check file size limits
   - Ensure image format is supported
   - Verify multer configuration

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy Secure Chatting! 🔐💬**