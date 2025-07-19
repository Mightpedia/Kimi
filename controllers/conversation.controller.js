const Conversation = require('../models/conversation.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const getConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ userId: req.user._id })
        .select('title updatedAt') // Only select needed fields for the list
        .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
});
const getConversationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, userId: req.user._id });

    if (!conversation) {
        throw new ApiError(404, "Conversation not found.");
    }

    res.status(200).json(conversation);
});

const deleteConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await Conversation.deleteOne({ _id: id, userId: req.user._id });

    if (result.deletedCount === 0) {
        throw new ApiError(404, "Conversation not found.");
    }

    res.status(200).json({ message: "Conversation deleted successfully." });
});


module.exports = {
    getConversations,
    getConversationById,
    deleteConversation,
};
