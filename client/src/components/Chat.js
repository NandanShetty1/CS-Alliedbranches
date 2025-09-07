import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { 
  Send, 
  LogOut, 
  Image, 
  Lock, 
  Unlock, 
  Download, 
  Upload,
  Users,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';

const ChatContainer = styled.div`
  display: flex;
  height: 90vh;
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const UserAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
  font-size: 18px;
`;

const UserName = styled.div`
  font-size: 18px;
  font-weight: 600;
`;

const RoomSection = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 15px;
  opacity: 0.9;
`;

const RoomInput = styled.input`
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  margin-bottom: 10px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const JoinButton = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const FeaturesSection = styled.div`
  flex: 1;
`;

const FeatureButton = styled.button`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  svg {
    margin-right: 10px;
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 12px;
  background: rgba(220, 53, 69, 0.8);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(220, 53, 69, 1);
  }

  svg {
    margin-right: 10px;
  }
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RoomName = styled.h2`
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;

  svg {
    margin-right: 10px;
    color: #667eea;
  }
`;

const EncryptionStatus = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.encrypted ? '#28a745' : '#6c757d'};
  font-size: 14px;

  svg {
    margin-right: 5px;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
`;

const Message = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.isOwn ? '#667eea' : 'white'};
  color: ${props => props.isOwn ? 'white' : '#333'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
`;

const MessageInfo = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const MessageInput = styled.div`
  padding: 20px;
  background: white;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #667eea;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const SendButton = styled.button`
  padding: 12px;
  background: #667eea;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #5a6fd8;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FileButton = styled.button`
  padding: 12px;
  background: #6c757d;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #5a6268;
  }
`;

const Chat = () => {
  const [currentRoom, setCurrentRoom] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user, handleLogout } = useAuth();
  const { socket } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('user-joined', (data) => {
        toast.info(`${data.username} joined the room`);
      });

      socket.on('user-left', (data) => {
        toast.info(`${data.username} left the room`);
      });

      socket.on('room-history', (history) => {
        setMessages(history);
      });
    }

    return () => {
      if (socket) {
        socket.off('new-message');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('room-history');
      }
    };
  }, [socket]);

  const joinRoom = () => {
    if (roomInput.trim() && socket) {
      socket.emit('join-room', { room: roomInput, username: user.username });
      setCurrentRoom(roomInput);
      setIsInRoom(true);
      toast.success(`Joined room: ${roomInput}`);
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leave-room', { room: currentRoom });
      setCurrentRoom('');
      setIsInRoom(false);
      setMessages([]);
      toast.info('Left the room');
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && socket && currentRoom) {
      let messageToSend = messageInput;
      
      if (isEncrypted && encryptionKey) {
        messageToSend = CryptoJS.AES.encrypt(messageInput, encryptionKey).toString();
      }

      socket.emit('send-message', {
        message: messageToSend,
        type: 'text',
        encrypted: isEncrypted
      });
      
      setMessageInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);
    toast.success('Image selected. You can now hide a message in it.');
  };

  const hideMessageInImage = async () => {
    if (!selectedFile || !messageInput.trim()) {
      toast.error('Please select an image and enter a message');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload image
      const uploadResponse = await fetch('http://localhost:5000/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error);
      }

      // Hide message in image
      const hideResponse = await fetch('http://localhost:5000/api/hide-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          imagePath: uploadData.filename,
          message: messageInput
        })
      });

      const hideData = await hideResponse.json();

      if (!hideResponse.ok) {
        throw new Error(hideData.error);
      }

      // Send steganographic image
      if (socket && currentRoom) {
        socket.emit('send-message', {
          message: `Steganographic image: ${hideData.stegoImagePath}`,
          type: 'stego-image',
          encrypted: false
        });
      }

      toast.success('Message hidden in image successfully!');
      setMessageInput('');
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleEncryption = () => {
    if (!isEncrypted) {
      const key = prompt('Enter encryption key:');
      if (key) {
        setEncryptionKey(key);
        setIsEncrypted(true);
        toast.success('Encryption enabled');
      }
    } else {
      setIsEncrypted(false);
      setEncryptionKey('');
      toast.info('Encryption disabled');
    }
  };

  return (
    <ChatContainer>
      <Sidebar>
        <UserInfo>
          <UserAvatar>
            {user.username.charAt(0).toUpperCase()}
          </UserAvatar>
          <UserName>{user.username}</UserName>
        </UserInfo>

        <RoomSection>
          <SectionTitle>Join Room</SectionTitle>
          <RoomInput
            type="text"
            placeholder="Room name"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
          />
          <JoinButton onClick={joinRoom}>
            {isInRoom ? 'Switch Room' : 'Join Room'}
          </JoinButton>
        </RoomSection>

        <FeaturesSection>
          <SectionTitle>Features</SectionTitle>
          <FeatureButton onClick={toggleEncryption}>
            {isEncrypted ? <Unlock size={16} /> : <Lock size={16} />}
            {isEncrypted ? 'Disable Encryption' : 'Enable Encryption'}
          </FeatureButton>
          <FeatureButton onClick={() => document.getElementById('fileInput').click()}>
            <Image size={16} />
            Upload Image
          </FeatureButton>
          {selectedFile && (
            <FeatureButton onClick={hideMessageInImage}>
              <Shield size={16} />
              Hide Message
            </FeatureButton>
          )}
        </FeaturesSection>

        <LogoutButton onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </LogoutButton>
      </Sidebar>

      <MainArea>
        <ChatHeader>
          <RoomName>
            <Users size={20} />
            {currentRoom || 'Select a room'}
          </RoomName>
          <EncryptionStatus encrypted={isEncrypted}>
            {isEncrypted ? <Lock size={16} /> : <Unlock size={16} />}
            {isEncrypted ? 'Encrypted' : 'Not Encrypted'}
          </EncryptionStatus>
        </ChatHeader>

        <MessagesContainer>
          {messages.map((message) => (
            <Message key={message.id} isOwn={message.username === user.username}>
              <MessageBubble isOwn={message.username === user.username}>
                {message.type === 'stego-image' ? (
                  <div>
                    <div>🔒 Steganographic Image</div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                      {message.message}
                    </div>
                  </div>
                ) : (
                  message.message
                )}
              </MessageBubble>
              <MessageInfo>
                <span>{message.username}</span>
                <span>•</span>
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                {message.encrypted && <Lock size={12} />}
              </MessageInfo>
            </Message>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <MessageInput>
          <FileInput
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <FileButton onClick={() => document.getElementById('fileInput').click()}>
            <Upload size={16} />
          </FileButton>
          <Input
            type="text"
            placeholder={selectedFile ? "Enter message to hide in image..." : "Type a message..."}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <SendButton onClick={selectedFile ? hideMessageInImage : sendMessage}>
            <Send size={16} />
          </SendButton>
        </MessageInput>
      </MainArea>
    </ChatContainer>
  );
};

export default Chat;