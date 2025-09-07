const express = require('express');
const multer = require('multer');
const steganography = require('../utils/steganography');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Hide message in image
router.post('/hide', upload.single('image'), async (req, res) => {
  try {
    const { message, encryptionKey } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let processedMessage = message;
    
    // Encrypt message if key provided
    if (encryptionKey) {
      processedMessage = steganography.encryptMessage(message, encryptionKey);
    }

    // Hide message in image
    const stegoImage = await steganography.hideMessage(req.file.buffer, processedMessage);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="stego_image.png"'
    });

    res.send(stegoImage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Extract message from image
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    const { encryptionKey } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Extract message from image
    const extractedMessage = await steganography.extractMessage(req.file.buffer);

    let decryptedMessage = extractedMessage;
    
    // Decrypt message if key provided
    if (encryptionKey) {
      try {
        decryptedMessage = steganography.decryptMessage(extractedMessage, encryptionKey);
      } catch (decryptError) {
        return res.status(400).json({ error: 'Decryption failed - invalid key or corrupted data' });
      }
    }

    res.json({ 
      message: decryptedMessage,
      extracted: true 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get image info (capacity check)
router.post('/info', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { data, info } = await sharp(req.file.buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const maxCapacity = Math.floor((data.length / 4) * 3 / 8); // Max characters
    const imageSize = req.file.size;
    const dimensions = `${info.width}x${info.height}`;

    res.json({
      dimensions,
      imageSize,
      maxCapacity,
      channels: info.channels
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;