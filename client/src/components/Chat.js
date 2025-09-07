import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Send, 
  Image, 
  Lock, 
  Unlock, 
  Users, 
  LogOut, 
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload
} from 'lucide-react';
import MessageList from './MessageList';
import UserList from './UserList';
import SteganographyModal from './SteganographyModal';

const Chat = ({ user, socket, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messageInput, setMessageInput] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showStegoModal, setShowStegoModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Join general room on connect
    socket.emit('join_room', 'general');

    // Socket event listeners
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('room_history', (history) => {
      setMessages(history);
    });

    socket.on('users_updated', (userList) => {
      setUsers(userList);
    });

    socket.on('user_joined', (data) => {
      console.log(`${data.username} joined the room`);
    });

    socket.on('user_left', (data) => {
      console.log(`${data.username} left the room`);
    });

    socket.on('user_typing', (data) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, username: data.username }];
          }
          return filtered;
        });
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('room_history');
      socket.off('users_updated');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('user_typing');
    };
  }, [socket, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socket.emit('send_message', {
      roomId: currentRoom,
      message: messageInput,
      encryptionKey: isEncrypted ? encryptionKey : null
    });

    setMessageInput('');
    setIsTyping(false);
    socket.emit('typing_stop', { roomId: currentRoom });
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { roomId: currentRoom });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', { roomId: currentRoom });
    }, 1000);
  };

  const handleStegoMessage = (stegoImage, originalMessage) => {
    socket.emit('send_stego_message', {
      roomId: currentRoom,
      stegoImage,
      originalMessage,
      encryptionKey: isEncrypted ? encryptionKey : null
    });
  };

  const toggleEncryption = () => {
    if (isEncrypted && !encryptionKey) {
      alert('Please enter an encryption key to enable encryption');
      return;
    }
    setIsEncrypted(!isEncrypted);
    if (!isEncrypted) {
      setEncryptionKey('');
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`${showUsers ? 'w-80' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Secure Chat</h1>
            <button
              onClick={() => setShowUsers(!showUsers)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showUsers && (
          <div className="flex-1 overflow-y-auto">
            <UserList users={users} currentUser={user} />
          </div>
        )}

        <div className="p-4 border-t">
          <div className="space-y-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              {showUsers && <span>Settings</span>}
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-2 p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {showUsers && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">#{currentRoom}</h2>
              <p className="text-sm text-gray-600">
                {users.length} user{users.length !== 1 ? 's' : ''} online
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleEncryption}
                className={`p-2 rounded-lg transition-colors ${
                  isEncrypted 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isEncrypted ? 'Encryption enabled' : 'Encryption disabled'}
              >
                {isEncrypted ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-blue-50 border-b p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Security Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="encryption"
                  checked={isEncrypted}
                  onChange={toggleEncryption}
                  className="rounded"
                />
                <label htmlFor="encryption" className="text-sm text-gray-700">
                  Enable end-to-end encryption
                </label>
              </div>
              {isEncrypted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Encryption Key
                  </label>
                  <div className="relative">
                    <input
                      type={showEncryptionKey ? 'text' : 'password'}
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Enter encryption key"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showEncryptionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList 
            messages={messages} 
            currentUser={user} 
            encryptionKey={encryptionKey}
            isEncrypted={isEncrypted}
          />
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={handleTyping}
                placeholder="Type your message..."
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={() => setShowStegoModal(true)}
                className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                title="Send steganography message"
              >
                <Image className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Steganography Modal */}
      {showStegoModal && (
        <SteganographyModal
          onClose={() => setShowStegoModal(false)}
          onSend={handleStegoMessage}
          encryptionKey={encryptionKey}
          isEncrypted={isEncrypted}
        />
      )}
    </div>
  );
};

export default Chat;