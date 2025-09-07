import React from 'react';
import { Download, Eye, Lock, Image as ImageIcon } from 'lucide-react';
import CryptoJS from 'crypto-js';

const MessageList = ({ messages, currentUser, encryptionKey, isEncrypted }) => {
  const decryptMessage = (encryptedMessage, key) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      return 'Decryption failed';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleDownloadImage = (imageData, filename) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageData}`;
    link.download = filename || 'stego_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.userId === currentUser.id;
        const isStegoMessage = message.messageType === 'steganography';
        
        let displayMessage = message.message;
        
        // Decrypt message if it's encrypted and we have the key
        if (message.encrypted && encryptionKey) {
          try {
            displayMessage = decryptMessage(message.message, encryptionKey);
          } catch (error) {
            displayMessage = 'Decryption failed - invalid key';
          }
        }

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} fade-in`}
          >
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {!isOwnMessage && (
                <div className="text-xs text-gray-500 mb-1 px-2">
                  {message.username}
                </div>
              )}
              
              <div
                className={`message-bubble ${
                  isOwnMessage 
                    ? 'message-sent' 
                    : isStegoMessage 
                      ? 'message-stego' 
                      : 'message-received'
                }`}
              >
                {isStegoMessage ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-purple-700">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Hidden Message</span>
                    </div>
                    <div className="text-sm">
                      {displayMessage}
                    </div>
                    {message.stegoImage && (
                      <div className="mt-2">
                        <img
                          src={`data:image/png;base64,${message.stegoImage}`}
                          alt="Steganography image"
                          className="w-full h-auto rounded border"
                        />
                        <button
                          onClick={() => handleDownloadImage(message.stegoImage, `stego_${message.id}.png`)}
                          className="mt-2 flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-800"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Image</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      {message.encrypted && (
                        <Lock className="w-3 h-3 text-green-500" title="Encrypted message" />
                      )}
                      <span className="text-sm">{displayMessage}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 px-2 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;