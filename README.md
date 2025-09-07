# Secure Stego Chat

Secure real-time web chat with end-to-end encryption, steganography (hide messages in PNGs), and Socket.IO.

## Features

- Client-side E2EE with passphrase (PBKDF2 + AES-GCM)
- Real-time rooms via Socket.IO
- Steganography: encode/decode hidden text in PNG (LSB)
- Minimal, responsive UI; no backend message storage
- Hardened Express server (Helmet, CORS, compression)

## Quick start

1. Install Node.js 18+.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in two browsers, join the same room, and set the same passphrase.

## Usage

- Enter a room name and click Join
- Enter a shared passphrase
- Type a message and Send (encrypted end-to-end)
- To send stego: select a PNG/JPEG as cover image, type a message, click "Send Stego PNG" (the message is encrypted, then hidden in a PNG sent to the room)
- To decode: choose a PNG via the Decode panel; the passphrase must match to decrypt

## Security model

- Messages are encrypted in the browser with AES-GCM. The server only relays ciphertext or PNGs; it never sees plaintext.
- Keys are derived from passphrases using PBKDF2-SHA256 with a random 16-byte salt per message and 120k iterations.
- IV is 12 random bytes per message.
- Stego uses simple LSB on PNG red-channel. It is not steganalysis-resistant; use for casual hiding only.
- No persistence: messages are not stored on the server.

## Environment

Copy `.env.example` to `.env` to change port or CORS origin.

## Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node","server/index.js"]
```

Build and run:

```bash
docker build -t secure-stego-chat .
docker run -p 3000:3000 secure-stego-chat
```

## Notes

- PNG capacity depends on image size; if message is too long, encoding will fail.
- JPEG uploads are converted to PNG before embedding.