#!/bin/bash

# Secure Chat Application Installation Script
echo "🚀 Installing Secure Chat Application with Steganography..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v14 or higher) first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Set up environment file
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment file..."
    cp .env.example .env
    echo "✅ Environment file created. You can modify .env if needed."
else
    echo "✅ Environment file already exists."
fi

# Make uploads directory writable
chmod 755 uploads

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend server: npm start"
echo "2. In a new terminal, start the frontend: cd client && npm start"
echo "3. Open your browser and go to http://localhost:3000"
echo ""
echo "🔐 Features available:"
echo "- Real-time chat with Socket.IO"
echo "- End-to-end encryption"
echo "- Steganography (hide messages in images)"
echo "- Secure authentication"
echo "- Modern responsive UI"
echo ""
echo "📖 For more information, see README.md"
echo ""
echo "Happy chatting! 🚀"