# Secure Steganography Chat

This repository contains a minimal proof-of-concept “Secure Real-Time Web-Based Chat Application with Steganography & Socket.IO.”

• **Backend**: Node.js + Express + Socket.IO<br>
• **Frontend**: Plain HTML/CSS/JS (no build step) for quick demo<br>
• **Steganography**: Very small LSB encoder/decoder implemented in `/client/stego.js` (PNG only, alpha-channel LSB)

## Quick Start (Dev)

```bash
# 1. Install dependencies for the server
cd server
npm install

# 2. Start the backend (serves frontend too)
npm start

# 3. Open the app
# Navigate to http://localhost:3000 in two separate browser tabs
```

## Folder Structure
```
.
├── client         # Static front-end files
│   ├── index.html
│   ├── script.js
│   └── stego.js
├── server         # Express + Socket.IO server
│   ├── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Roadmap
This skeleton demonstrates the core flow—encode → transmit → decode—suitable for coursework or extension into a production-grade system. See the project proposal for full feature list (auth, DB, HTTPS, Docker, etc.).