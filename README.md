Secure Real-Time Web Chat with Steganography and Socket.IO
==========================================================

Overview
--------
This project is a Node.js + Express + Socket.IO application that provides a secure, real-time chat experience in the browser. It features:

- End-to-end message encryption (AES-GCM) based on a shared passphrase
- Steganography: hide encrypted text inside PNG/JPEG images via client-side LSB encoding
- JWT-based login and registration with a simple JSON user store (bcrypt hashed passwords)
- Minimal, responsive UI for joining a chat room and exchanging text or images

Important security notes
------------------------
- The E2EE relies on users sharing the same passphrase per room. The server does not know the passphrase.
- The steganography implementation is educational. It is not robust against transformations like lossy re-compression or resizing.
- JWT secret in `.env` must be changed in production. Use HTTPS in production.

Getting started
---------------
1. Copy environment file and configure:
   ```bash
   cp .env.example .env
   # edit .env: set JWT_SECRET, PORT if desired
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the server:
   ```bash
   npm run dev
   # or: npm start
   ```

4. Open the app:
   - Navigate to `http://localhost:3000` and register or login.
   - Go to the chat page and join a room (e.g., `alpha`).
   - Set a shared passphrase to enable end-to-end encryption.

Usage tips
----------
- Text messages: if a passphrase is set, they are AES-GCM encrypted in the browser.
- Images: attach a PNG/JPEG. If "Use Steganography" is checked and you typed a message, that message is encrypted (if passphrase set) and embedded into the image.
- On receipt, the client also attempts to extract a hidden string from images, and if a passphrase is set, it decrypts it.

Project structure
-----------------
```
server/
  index.js        # Express + Socket.IO server
  auth.js         # JWT sign/verify and middlewares
  userStore.js    # JSON user store (bcrypt hashed)
public/
  index.html      # Register/Login
  chat.html       # Chat room UI
  css/styles.css  # Styles
  js/crypto.js    # AES-GCM helpers (Web Crypto)
  js/stego.js     # LSB steganography (Canvas)
  js/app.js       # Client-side app logic
data/
  users.json      # created on first run
```

API
---
- `POST /api/register` { username, password, displayName? } -> { token, user }
- `POST /api/login` { username, password } -> { token, user }
- `GET /api/me` (Authorization: Bearer <token>) -> { user }

Socket events
-------------
- Client -> Server: `join` { room, displayName? }
- Client -> Server: `message` { room, kind: 'text'|'image', content }
- Client -> Server: `typing` boolean
- Server -> Client: `system` { type: 'join'|'leave', user, at }
- Server -> Client: `room_users` { users }
- Server -> Client: `message` same shape as incoming with `from`, `at`

License
-------
MIT

# CS-Alliedbranches