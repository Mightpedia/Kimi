const express = require('express');
const authRoutes = require('./auth.routes');
const chatRoutes = require('./chat.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);


module.exports = router;