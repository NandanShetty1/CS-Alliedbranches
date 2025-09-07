import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Eye, EyeOff, Lock, Image as ImageIcon, Send } from 'lucide-react';

const SteganographyModal = ({ onClose, onSend, encryptionKey, isEncrypted }) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    },
    maxFiles: 1
  });

  const handleHideMessage = async () => {
    if (!selectedImage || !message.trim()) {
      setError('Please select an image and enter a message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('message', message);
      if (isEncrypted && encryptionKey) {
        formData.append('encryptionKey', encryptionKey);
      }

      const response = await fetch('/api/steganography/hide', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to hide message');
      }

      const stegoImageBlob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result.split(',')[1];
        onSend(base64Image, message);
        onClose();
      };
      reader.readAsDataURL(stegoImageBlob);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractMessage = async () => {
    if (!selectedImage) {
      setError('Please select an image to extract message from');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (isEncrypted && encryptionKey) {
        formData.append('encryptionKey', encryptionKey);
      }

      const response = await fetch('/api/steganography/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract message');
      }

      const data = await response.json();
      setMessage(data.message);
      setShowMessage(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setError('');
    setShowMessage(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ImageIcon className="w-6 h-6 mr-2 text-purple-600" />
              Steganography
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                {isDragActive ? (
                  <p className="text-purple-600">Drop the image here...</p>
                ) : (
                  <p className="text-gray-600">
                    Drag & drop an image here, or click to select
                  </p>
                )}
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-48 object-contain mx-auto rounded border"
                  />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Hide
              </label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your secret message..."
                  className="input-field w-full h-24 resize-none"
                  disabled={showMessage}
                />
                {showMessage && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setShowMessage(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Encryption Status */}
            {isEncrypted && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <Lock className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">
                  Message will be encrypted with your key
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleHideMessage}
                disabled={loading || !selectedImage || !message.trim()}
                className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Hide Message</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleExtractMessage}
                disabled={loading || !selectedImage}
                className="btn-secondary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Extract Message</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Reset Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SteganographyModal;