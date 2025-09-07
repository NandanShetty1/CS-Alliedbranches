# Secure Steganography Chat Application

A secure real-time web-based chat application featuring advanced steganography and Socket.IO for hidden message communication.

## 🔒 Features

### Security Features
- **End-to-End Encryption**: Messages can be encrypted using AES-256 encryption
- **JWT Authentication**: Secure user authentication and session management
- **Password-based Key Derivation**: PBKDF2 for secure key generation
- **HMAC Integrity Checks**: Message integrity verification
- **Rate Limiting**: Protection against spam and abuse
- **Security Headers**: Helmet.js for enhanced security

### Steganography Features
- **LSB Steganography**: Hide messages in image pixels using Least Significant Bit technique
- **Multiple Image Formats**: Support for PNG, JPEG, and other common formats
- **Message Extraction**: Extract hidden messages from steganographic images
- **Image Validation**: Automatic validation of image capacity for message hiding
- **Test Image Generation**: Built-in test image generator for demonstration

### Communication Features
- **Real-time Messaging**: Instant messaging using Socket.IO
- **Room-based Chat**: Join different chat rooms for organized communication
- **Message History**: Persistent message storage and retrieval
- **User Presence**: Real-time user join/leave notifications
- **File Upload**: Image upload support with size and type validation

### User Interface
- **Modern Design**: Clean, responsive interface with dark/light themes
- **Mobile Responsive**: Optimized for desktop and mobile devices
- **Real-time Status**: Connection status and user presence indicators
- **Toast Notifications**: User-friendly feedback and error messages
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd secure-steganography-chat
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser and navigate to:**
```
http://localhost:3000
```

### Production Deployment

1. **Set environment variables:**
```bash
export JWT_SECRET="your-super-secure-jwt-secret-key"
export ENCRYPTION_KEY="your-encryption-key-for-messages"
export NODE_ENV="production"
export PORT="3000"
```

2. **Start the production server:**
```bash
npm start
```

## 📖 Usage Guide

### Getting Started

1. **Register/Login**: Create an account or login with existing credentials
2. **Join a Room**: Enter a room ID (e.g., "general", "secure-chat") and click Join
3. **Send Messages**: Type messages in the input field and press Enter or click Send

### Using Encryption

1. **Enable Encryption**: Check the "Encrypt Messages" checkbox in the sidebar
2. **Set Encryption Key**: Enter a custom encryption key (optional)
3. **Send Encrypted Messages**: All messages will be automatically encrypted

### Using Steganography

#### Hiding Messages in Images

1. **Upload Image**: Click "Upload Image" and select an image file (PNG, JPEG)
2. **Activate Steganography Mode**: Click the image icon in the message input area
3. **Enter Hidden Message**: Type the message you want to hide in the image
4. **Hide Message**: Click "Hide Message" to embed the message in the image
5. **Send**: Click "Send Hidden Message" to share the steganographic image

#### Extracting Hidden Messages

1. **Activate Extract Mode**: Click the search icon in the message input area
2. **Click on Images**: Click on any image in the chat to attempt message extraction
3. **View Results**: Hidden messages will be displayed in the extract panel

### Advanced Features

#### Test Image Generation
- Click "Generate Test Image" to create a sample image with a hidden message
- Useful for testing steganography functionality

#### Room Management
- Switch between different rooms by entering new room IDs
- Each room maintains its own message history and user list

#### Security Options
- Toggle message encryption on/off
- Use custom encryption keys for enhanced security
- All encrypted messages are marked with a lock icon

## 🏗️ Architecture

### Backend Components

#### Server (`server.js`)
- Express.js web server with Socket.IO integration
- Security middleware (Helmet, CORS, rate limiting)
- File upload handling with Multer
- Room and user management

#### Authentication (`routes/auth.js`, `middleware/auth.js`)
- JWT-based authentication system
- User registration and login endpoints
- Token verification middleware
- Socket.IO authentication middleware

#### Steganography Service (`services/steganography.js`)
- LSB steganography implementation using Sharp.js
- Message encoding/decoding with length prefixes
- Image validation and capacity checking
- Support for multiple image formats

#### Encryption Service (`services/encryption.js`)
- AES-256 encryption using CryptoJS
- PBKDF2 key derivation
- HMAC integrity verification
- Secure random key generation

### Frontend Components

#### Main Application (`public/app.js`)
- Socket.IO client integration
- Real-time message handling
- User interface management
- Image processing and steganography client-side logic

#### User Interface (`public/index.html`, `public/styles.css`)
- Responsive design with CSS Grid/Flexbox
- Modern UI components and animations
- Mobile-first responsive design
- Accessibility features

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
ENCRYPTION_KEY=your-default-encryption-key-for-messages

# Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH=./uploads
```

### Security Configuration

The application includes several security measures:

- **Helmet.js**: Sets security headers including CSP, HSTS, etc.
- **Rate Limiting**: 100 requests per 15-minute window per IP
- **File Upload Limits**: 5MB maximum file size, image files only
- **JWT Expiration**: 24-hour token expiration
- **Password Hashing**: bcrypt with 12 salt rounds

## 🧪 Testing

### Manual Testing

1. **Authentication**: Test user registration and login
2. **Real-time Messaging**: Send messages between multiple browser tabs
3. **Encryption**: Enable encryption and verify messages are encrypted/decrypted
4. **Steganography**: Hide messages in images and extract them
5. **Room Management**: Test joining/leaving different rooms

### Test Cases

#### Steganography Testing
```javascript
// Test message hiding and extraction
const testMessage = "Secret message for testing";
const testImage = "base64-encoded-image-data";

// Hide message
const result = await SteganographyService.hideMessage(testImage, testMessage);

// Extract message
const extracted = await SteganographyService.extractMessage(result.imageData);
console.assert(extracted === testMessage, "Message extraction failed");
```

#### Encryption Testing
```javascript
// Test encryption and decryption
const testMessage = "Test message for encryption";
const encrypted = EncryptionService.encrypt(testMessage);
const decrypted = EncryptionService.decrypt(encrypted);
console.assert(decrypted === testMessage, "Encryption/decryption failed");
```

## 🛡️ Security Considerations

### Best Practices Implemented

1. **Input Validation**: All user inputs are validated and sanitized
2. **SQL Injection Prevention**: No SQL database used (in-memory storage)
3. **XSS Prevention**: HTML escaping for all user-generated content
4. **CSRF Protection**: JWT tokens prevent CSRF attacks
5. **Secure Headers**: Comprehensive security headers via Helmet.js

### Production Security Checklist

- [ ] Change default JWT secret and encryption keys
- [ ] Use HTTPS in production
- [ ] Implement proper database with prepared statements
- [ ] Add logging and monitoring
- [ ] Regular security updates for dependencies
- [ ] Implement user session management
- [ ] Add brute force protection
- [ ] Configure proper CORS policies

## 🚨 Known Limitations

1. **In-Memory Storage**: User data and messages are stored in memory (use a database for production)
2. **Image Processing**: Large images may cause performance issues
3. **Message Capacity**: Steganography capacity depends on image size
4. **Browser Compatibility**: Modern browsers required for full functionality
5. **Concurrent Users**: No horizontal scaling implemented

## 🔮 Future Enhancements

### Planned Features
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Advanced steganography algorithms
- [ ] File sharing capabilities
- [ ] Voice/video calling
- [ ] Message search functionality
- [ ] User profiles and avatars
- [ ] Message reactions and emojis
- [ ] Push notifications
- [ ] Admin panel and moderation tools
- [ ] API documentation with Swagger

### Security Enhancements
- [ ] Two-factor authentication (2FA)
- [ ] Perfect Forward Secrecy
- [ ] Message expiration/self-destruct
- [ ] Advanced key management
- [ ] Audit logging
- [ ] Intrusion detection

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

## 🙏 Acknowledgments

- **Sharp.js** - High-performance image processing
- **Socket.IO** - Real-time bidirectional event-based communication
- **CryptoJS** - JavaScript cryptography library
- **Express.js** - Fast, unopinionated web framework
- **Helmet.js** - Security middleware for Express
- **bcrypt** - Password hashing library

---

**⚠️ Disclaimer**: This application is for educational and demonstration purposes. For production use, additional security measures and thorough testing are recommended.