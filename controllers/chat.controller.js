const fs = require('fs');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { AI_MODELS } = require('../config/models');
const { performSearch } = require('../services/serpapi.service');
const { getChatStream, analyzeImage } = require('../services/openrouter.service');
const Conversation = require('../models/conversation.model');

const getOrCreateConversation = async (userId, conversationId, initialMessage) => {
  if (conversationId) {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (conversation) return conversation;
  }
  const title = initialMessage.substring(0, 50) + (initialMessage.length > 50 ? '...' : '');
  return new Conversation({ userId, title, messages: [] });
};

const prepareContext = (messages, searchResults, userMessage) => {
    let context = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
    }));
    
    if (searchResults && searchResults.length > 0) {
        const searchContext = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
        context.push({
            role: 'system',
            content: `Here are some web search results to help answer the user's query:\n${searchContext}`
        });
    }

    context.push({ role: 'user', content: userMessage });
    return context;
};


const handleChat = asyncHandler(async (req, res) => {
  const { message, conversationId, model = 'deepseek-chat', enableSearch = 'false' } = req.body;
  const imageFile = req.file;

  if (!message && !imageFile) {
    throw new ApiError(400, 'A message or an image is required.');
  }
  if (!AI_MODELS[model]) {
    throw new ApiError(400, 'Invalid model selected.');
  }
  
  const conversation = await getOrCreateConversation(req.user._id, conversationId, message);

  conversation.messages.push({ role: 'user', content: message, hasImage: !!imageFile });
  
  let finalResponseContent = '';

  if (imageFile) {
    if (!AI_MODELS[model].capabilities.includes('vision')) {
        throw new ApiError(400, `The selected model '${AI_MODELS[model].name}' does not support image analysis. Please choose a vision-capable model.`);
    }
    const base64Image = imageFile.buffer.toString('base64');
    finalResponseContent = await analyzeImage(base64Image, imageFile.mimetype, message);
    
    const assistantMessage = { role: 'assistant', content: finalResponseContent, model };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    return res.status(200).json({
      conversationId: conversation._id,
      message: finalResponseContent,
      model: AI_MODELS[model].name,
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);

  let searchResults = [];
  if (enableSearch === 'true') {
      searchResults = await performSearch(message);
      res.write(`event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`);
  }
  
  const context = prepareContext(conversation.messages, searchResults, message);
  const stream = await getChatStream(AI_MODELS[model].model, context);

  stream.on('data', chunk => {
    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
                res.write('event: done\ndata: {}\n\n');
                res.end();
                return;
            }
            try {
                const json = JSON.parse(data);
                const token = json.choices[0].delta?.content || '';
                if(token) {
                    finalResponseContent += token;
                    res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
                }
            } catch (e) {
                
            }
        }
    }
  });

  stream.on('end', async () => {
    const assistantMessage = {
        role: 'assistant',
        content: finalResponseContent,
        searchResults: searchResults.length > 0 ? searchResults : undefined,
        model
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();
    res.end();
  });
  
  stream.on('error', async (err) => {
    console.error("Stream error:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ message: "An error occurred during the stream." })}\n\n`);
    res.end();
  });
});

const getAvailableModels = asyncHandler(async (req, res) => {
  res.status(200).json(AI_MODELS);
});

module.exports = { handleChat, getAvailableModels };
