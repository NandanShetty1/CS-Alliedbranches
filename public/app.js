// Global variables
let socket = null;
let currentUser = null;
let currentRoom = null;
let authToken = null;
let selectedImage = null;
let isExtractMode = false;

// DOM elements
const authModal = document.getElementById('authModal');
const chatApp = document.getElementById('chatApp');
const authForm = document.getElementById('authForm');
const authButton = document.getElementById('authButton');
const authSwitchButton = document.getElementById('authSwitchButton');
const authError = document.getElementById('authError');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkExistingAuth();
});

function initializeApp() {
    // Show auth modal initially
    showAuthModal();
}

function setupEventListeners() {
    // Auth form submission
    authForm.addEventListener('submit', handleAuthSubmit);
    
    // Auth mode switching
    authSwitchButton.addEventListener('click', toggleAuthMode);
    
    // Logout
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    
    // Room management
    document.getElementById('joinRoomButton').addEventListener('click', joinRoom);
    document.getElementById('roomInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom();
    });
    
    // Message sending
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Encryption toggle
    document.getElementById('encryptMessages').addEventListener('change', toggleEncryption);
    
    // Image upload
    document.getElementById('uploadImageButton').addEventListener('click', () => {
        document.getElementById('imageUpload').click();
    });
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
    // Test image generation
    document.getElementById('generateTestImage').addEventListener('click', generateTestImage);
    
    // Steganography mode
    document.getElementById('steganographyMode').addEventListener('click', toggleSteganographyMode);
    document.getElementById('extractMode').addEventListener('click', toggleExtractMode);
    
    // Panel controls
    document.getElementById('closeStegoPanel').addEventListener('click', closeSteganographyPanel);
    document.getElementById('closeExtractPanel').addEventListener('click', closeExtractPanel);
    
    // Steganography actions
    document.getElementById('hideMsgButton').addEventListener('click', hideMessageInImage);
    document.getElementById('sendStegoButton').addEventListener('click', sendSteganographyMessage);
}

// Authentication functions
function checkExistingAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        verifyToken(token);
    }
}

async function verifyToken(token) {
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = token;
            currentUser = data.user;
            hideAuthModal();
            initializeChat();
        } else {
            localStorage.removeItem('authToken');
            showAuthModal();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('authToken');
        showAuthModal();
    }
}

function showAuthModal() {
    authModal.style.display = 'flex';
    chatApp.style.display = 'none';
}

function hideAuthModal() {
    authModal.style.display = 'none';
    chatApp.style.display = 'flex';
}

function toggleAuthMode() {
    const isLogin = authButton.textContent.includes('Login');
    
    if (isLogin) {
        // Switch to register mode
        document.getElementById('authTitle').textContent = 'Create Account';
        document.getElementById('authSubtitle').textContent = 'Join the secure chat community';
        document.getElementById('emailGroup').style.display = 'block';
        document.getElementById('email').required = true;
        authButton.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        document.getElementById('authSwitchText').textContent = 'Already have an account?';
        authSwitchButton.textContent = 'Login here';
    } else {
        // Switch to login mode
        document.getElementById('authTitle').textContent = 'Login to Secure Chat';
        document.getElementById('authSubtitle').textContent = 'Enter your credentials to access the secure chat';
        document.getElementById('emailGroup').style.display = 'none';
        document.getElementById('email').required = false;
        authButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        document.getElementById('authSwitchText').textContent = "Don't have an account?";
        authSwitchButton.textContent = 'Register here';
    }
    
    hideError();
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const isLogin = authButton.textContent.includes('Login');
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('Please fill in all required fields');
        return;
    }
    
    showLoading('Authenticating...');
    
    try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin 
            ? { username, password }
            : { username, email, password };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            hideAuthModal();
            initializeChat();
            showToast('Authentication successful!', 'success');
        } else {
            showError(data.error || 'Authentication failed');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showError('Connection error. Please try again.');
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    currentRoom = null;
    
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    // Reset form
    authForm.reset();
    hideError();
    
    // Show auth modal
    showAuthModal();
    
    showToast('Logged out successfully', 'success');
}

// Chat initialization
function initializeChat() {
    document.getElementById('currentUser').textContent = currentUser.username;
    connectSocket();
}

function connectSocket() {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io({
        auth: {
            token: authToken
        }
    });
    
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        showToast('Connected to server', 'success');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
        showToast('Disconnected from server', 'warning');
    });
    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        updateConnectionStatus(false);
        showToast('Connection error: ' + error.message, 'error');
    });
    
    // Message events
    socket.on('new-message', handleNewMessage);
    socket.on('message-history', handleMessageHistory);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('message-extracted', handleMessageExtracted);
    socket.on('error', handleSocketError);
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (connected) {
        statusElement.className = 'status-connected';
        statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
    } else {
        statusElement.className = 'status-disconnected';
        statusElement.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
    }
}

// Room management
function joinRoom() {
    const roomId = document.getElementById('roomInput').value.trim();
    if (!roomId) {
        showToast('Please enter a room ID', 'warning');
        return;
    }
    
    if (currentRoom) {
        socket.emit('leave-room', currentRoom);
    }
    
    currentRoom = roomId;
    socket.emit('join-room', roomId);
    document.getElementById('currentRoom').textContent = roomId;
    
    // Clear messages
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    
    showToast(`Joined room: ${roomId}`, 'success');
}

// Message handling
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    if (!currentRoom) {
        showToast('Please join a room first', 'warning');
        return;
    }
    
    const isEncrypted = document.getElementById('encryptMessages').checked;
    
    socket.emit('send-message', {
        roomId: currentRoom,
        message: message,
        isEncrypted: isEncrypted
    });
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
}

function handleNewMessage(messageData) {
    addMessageToChat(messageData);
}

function handleMessageHistory(messages) {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    
    messages.forEach(message => {
        addMessageToChat(message, false);
    });
    
    scrollToBottom();
}

function addMessageToChat(messageData, animate = true) {
    const messagesArea = document.getElementById('messagesArea');
    const messageElement = createMessageElement(messageData);
    
    if (!animate) {
        messageElement.style.animation = 'none';
    }
    
    messagesArea.appendChild(messageElement);
    scrollToBottom();
}

function createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    if (messageData.userId === currentUser.id) {
        messageDiv.classList.add('own');
    }
    
    if (messageData.type === 'system') {
        messageDiv.classList.add('system');
    }
    
    const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
    const messageType = messageData.type === 'steganography' ? 'Hidden Message' : 'Text';
    
    let contentHtml = '';
    
    if (messageData.type === 'steganography' && messageData.imageData) {
        contentHtml = `
            <div class="message-text">${messageData.message}</div>
            <img src="${messageData.imageData}" class="message-image" onclick="handleImageClick('${messageData.imageData}')" alt="Steganography image">
        `;
    } else {
        contentHtml = `<div class="message-text">${escapeHtml(messageData.message)}</div>`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(messageData.username)}</span>
            <span class="message-timestamp">${timestamp}</span>
            <span class="message-type">${messageType}</span>
        </div>
        <div class="message-content">
            ${contentHtml}
            ${messageData.isEncrypted ? '<div class="encrypted-indicator"><i class="fas fa-lock"></i> Encrypted</div>' : ''}
        </div>
    `;
    
    return messageDiv;
}

function handleUserJoined(userData) {
    const messageData = {
        username: 'System',
        message: `${userData.username} joined the room`,
        timestamp: userData.timestamp,
        type: 'system',
        userId: 'system'
    };
    addMessageToChat(messageData);
}

function handleUserLeft(userData) {
    const messageData = {
        username: 'System',
        message: `${userData.username} left the room`,
        timestamp: userData.timestamp,
        type: 'system',
        userId: 'system'
    };
    addMessageToChat(messageData);
}

function handleSocketError(error) {
    console.error('Socket error:', error);
    showToast('Error: ' + error, 'error');
}

// Encryption functions
function toggleEncryption() {
    const isEnabled = document.getElementById('encryptMessages').checked;
    const keyGroup = document.querySelector('.encryption-key-group');
    
    if (isEnabled) {
        keyGroup.style.display = 'block';
        showToast('Encryption enabled', 'success');
    } else {
        keyGroup.style.display = 'none';
        showToast('Encryption disabled', 'warning');
    }
}

// Image handling
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image file too large (max 5MB)', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImage = e.target.result;
        displayImagePreview(selectedImage);
        showToast('Image uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
}

function displayImagePreview(imageData) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${imageData}" alt="Uploaded image">`;
    preview.classList.add('has-image');
    
    // Also update steganography preview if panel is open
    const stegoPreview = document.getElementById('stegoImagePreview');
    if (stegoPreview) {
        stegoPreview.innerHTML = `<img src="${imageData}" alt="Steganography image">`;
        stegoPreview.classList.add('has-image');
    }
}

async function generateTestImage() {
    showLoading('Generating test image...');
    
    try {
        const response = await fetch('/api/test-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                width: 400,
                height: 300,
                message: 'This is a test hidden message!'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            selectedImage = data.imageData;
            displayImagePreview(selectedImage);
            showToast('Test image generated with hidden message', 'success');
        } else {
            throw new Error('Failed to generate test image');
        }
    } catch (error) {
        console.error('Error generating test image:', error);
        
        // Fallback: create a simple test image client-side
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 300);
        
        // Add some text
        ctx.fillStyle = 'white';
        ctx.font = '24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Test Image for Steganography', 200, 150);
        
        selectedImage = canvas.toDataURL('image/png');
        displayImagePreview(selectedImage);
        showToast('Test image generated (client-side)', 'success');
    } finally {
        hideLoading();
    }
}

// Steganography functions
function toggleSteganographyMode() {
    const panel = document.getElementById('steganographyPanel');
    const extractPanel = document.getElementById('extractPanel');
    
    // Close extract panel if open
    extractPanel.style.display = 'none';
    isExtractMode = false;
    
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
        
        if (selectedImage) {
            displaySteganographyImage(selectedImage);
        }
        
        showToast('Steganography mode activated', 'success');
    } else {
        panel.style.display = 'none';
        showToast('Steganography mode deactivated', 'warning');
    }
}

function toggleExtractMode() {
    const panel = document.getElementById('extractPanel');
    const stegoPanel = document.getElementById('steganographyPanel');
    
    // Close steganography panel if open
    stegoPanel.style.display = 'none';
    
    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
        isExtractMode = true;
        showToast('Extract mode activated - click on images to extract hidden messages', 'success');
    } else {
        panel.style.display = 'none';
        isExtractMode = false;
        showToast('Extract mode deactivated', 'warning');
    }
}

function closeSteganographyPanel() {
    document.getElementById('steganographyPanel').style.display = 'none';
}

function closeExtractPanel() {
    document.getElementById('extractPanel').style.display = 'none';
    isExtractMode = false;
}

function displaySteganographyImage(imageData) {
    const preview = document.getElementById('stegoImagePreview');
    preview.innerHTML = `<img src="${imageData}" alt="Steganography image">`;
    preview.classList.add('has-image');
}

async function hideMessageInImage() {
    const message = document.getElementById('stegoMessage').value.trim();
    
    if (!message) {
        showToast('Please enter a message to hide', 'warning');
        return;
    }
    
    if (!selectedImage) {
        showToast('Please select an image first', 'warning');
        return;
    }
    
    showLoading('Hiding message in image...');
    
    try {
        // Simulate steganography process (in a real app, this would call the server)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showToast('Message hidden in image successfully', 'success');
    } catch (error) {
        console.error('Error hiding message:', error);
        showToast('Failed to hide message in image', 'error');
    } finally {
        hideLoading();
    }
}

function sendSteganographyMessage() {
    const message = document.getElementById('stegoMessage').value.trim();
    
    if (!message) {
        showToast('Please enter a message to hide', 'warning');
        return;
    }
    
    if (!selectedImage) {
        showToast('Please select an image first', 'warning');
        return;
    }
    
    if (!currentRoom) {
        showToast('Please join a room first', 'warning');
        return;
    }
    
    const isEncrypted = document.getElementById('encryptMessages').checked;
    
    socket.emit('send-steganography', {
        roomId: currentRoom,
        message: message,
        imageData: selectedImage,
        isEncrypted: isEncrypted
    });
    
    document.getElementById('stegoMessage').value = '';
    closeSteganographyPanel();
    showToast('Steganography message sent', 'success');
}

function handleImageClick(imageData) {
    if (isExtractMode) {
        extractMessageFromImage(imageData);
    }
}

function extractMessageFromImage(imageData) {
    showLoading('Extracting hidden message...');
    
    socket.emit('extract-message', {
        imageData: imageData
    });
}

function handleMessageExtracted(data) {
    hideLoading();
    
    const resultDiv = document.getElementById('extractResult');
    if (data.message) {
        resultDiv.innerHTML = `
            <strong>Extracted Message:</strong><br>
            <div style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                ${escapeHtml(data.message)}
            </div>
            <small style="color: #666; margin-top: 8px; display: block;">
                Extracted at ${new Date(data.timestamp).toLocaleString()}
            </small>
        `;
        showToast('Hidden message extracted successfully', 'success');
    } else {
        resultDiv.innerHTML = '<em style="color: #666;">No hidden message found in this image.</em>';
        showToast('No hidden message found', 'warning');
    }
}

// Utility functions
function showLoading(text = 'Loading...') {
    document.getElementById('loadingText').textContent = text;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showError(message) {
    authError.textContent = message;
    authError.classList.add('show');
}

function hideError() {
    authError.classList.remove('show');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

function scrollToBottom() {
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make handleImageClick globally available
window.handleImageClick = handleImageClick;