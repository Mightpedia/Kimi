const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
    getConversations,
    getConversationById,
    deleteConversation
} = require('../controllers/conversation.controller');

const router = express.Router();
router.use(authMiddleware);

router.route('/')
    .get(getConversations);

router.route('/:id')
    .get(getConversationById)
    .delete(deleteConversation);

module.exports = router;
