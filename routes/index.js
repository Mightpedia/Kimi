// routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const chatRoutes = require('./chat.routes');
const conversationRoutes = require('./conversation.routes.js'); // Import conversation routes

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/conversations', conversationRoutes); // Add this line

module.exports = router;
