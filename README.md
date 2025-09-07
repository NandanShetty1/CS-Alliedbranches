# Secure Real-Time Chat Application with Steganography

A modern, secure web-based chat application that combines real-time messaging with steganography capabilities and end-to-end encryption. Built with React, Node.js, Socket.IO, and advanced security features.

## 🔐 Features

### Core Chat Features
- **Real-time messaging** using Socket.IO
- **Room-based chat** system
- **User authentication** with JWT tokens
- **Modern, responsive UI** with styled-components
- **Message history** and room persistence

### Security Features
- **End-to-end encryption** using AES-256-CBC
- **Password hashing** with bcrypt
- **Rate limiting** to prevent abuse
- **Helmet.js** for security headers
- **CORS protection**

### Steganography Features
- **Hide messages in images** using LSB (Least Significant Bit) steganography
- **Extract hidden messages** from steganographic images
- **Support for PNG images** with high capacity
- **Secure message hiding** in image files

### Advanced Features
- **File upload** with image validation
- **Real-time notifications** with toast messages
- **Encryption key management**
- **Steganographic image sharing**
- **User presence indicators**

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-chat-steganography
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

4. **Start the application**
   ```bash
   # Start the backend server
   npm start
   
   # In a new terminal, start the frontend
   cd client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📖 Usage Guide

### Getting Started

1. **Register/Login**
   - Create a new account or login with existing credentials
   - Your session will be maintained with JWT tokens

2. **Join a Chat Room**
   - Enter a room name in the sidebar
   - Click "Join Room" to enter the chat
   - You can switch between different rooms

3. **Send Messages**
   - Type your message in the input field
   - Press Enter or click Send to send the message
   - Messages are displayed in real-time

### Security Features

#### End-to-End Encryption
1. Click "Enable Encryption" in the sidebar
2. Enter a strong encryption key
3. All messages will be encrypted before sending
4. Only users with the same key can decrypt messages

#### Steganography
1. Click "Upload Image" to select an image file
2. Type the message you want to hide
3. Click "Hide Message" to embed the message in the image
4. The steganographic image will be shared in the chat

### API Endpoints

#### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login with credentials

#### File Operations
- `POST /api/upload-image` - Upload an image file
- `POST /api/hide-message` - Hide message in image
- `POST /api/extract-message` - Extract message from image

## 🛠️ Technical Architecture

### Backend (Node.js + Express)
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Sharp** - Image processing
- **Multer** - File upload handling
- **Helmet** - Security headers
- **Rate limiting** - API protection

### Frontend (React)
- **React 18** - UI framework
- **Socket.IO Client** - Real-time communication
- **Styled Components** - CSS-in-JS styling
- **Crypto-JS** - Client-side encryption
- **React Dropzone** - File upload UI
- **React Toastify** - Notifications

### Steganography Implementation
- **LSB (Least Significant Bit)** method
- **PNG format** support for lossless compression
- **Binary encoding** for message storage
- **Capacity calculation** to ensure image can hold message

## 🔒 Security Considerations

### Implemented Security Measures
- Password hashing with bcrypt (10 rounds)
- JWT token authentication with expiration
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- File type validation for uploads

### Encryption Details
- **Algorithm**: AES-256-CBC
- **Key derivation**: User-provided keys
- **IV**: Random initialization vectors
- **Encoding**: Hex encoding for transmission

### Steganography Security
- **Method**: LSB steganography
- **Format**: PNG for lossless compression
- **Detection**: Difficult to detect without knowledge
- **Capacity**: Limited by image size

## 📁 Project Structure

```
secure-chat-steganography/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── index.js
│   └── package.json
├── uploads/                # Uploaded files
├── server.js              # Main server file
├── package.json           # Backend dependencies
├── .env                   # Environment variables
└── README.md
```

## 🚀 Deployment

### Environment Variables
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### Production Build
```bash
# Build the React app
cd client
npm run build

# Start the production server
cd ..
npm start
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
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
1. Test user registration and login
2. Test real-time messaging
3. Test room joining and leaving
4. Test encryption/decryption
5. Test steganography features
6. Test file uploads

### Security Testing
1. Test rate limiting
2. Test authentication bypass attempts
3. Test file upload validation
4. Test encryption key management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is for educational and demonstration purposes. While it implements various security measures, it should not be used for highly sensitive communications without additional security audits and improvements.

## 🔮 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Message persistence
- User profiles and avatars
- Group management
- Message search functionality
- Advanced steganography algorithms
- Mobile app support
- Video/audio call integration
- Message reactions and replies
- Admin panel for room management

## 📞 Support

For questions or issues, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for secure communication**