const express = require('express');
const { handleChat, getAvailableModels } = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { rateLimitMiddleware } = require('../middleware/rateLimit.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', 
  authMiddleware, 
  rateLimitMiddleware, 
  upload.single('image'), 
  handleChat
);

router.get('/models', authMiddleware, getAvailableModels);

module.exports = router;