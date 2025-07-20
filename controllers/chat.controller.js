const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { AI_MODELS } = require('../config/models');
const { performSearch } = require('../services/serpapi.service');
const { openRouterClient, getChatStream, analyzeImage } = require('../services/openrouter.service');
const Conversation = require('../models/conversation.model');

// --- Helper Functions ---

const getOrCreateConversation = async (userId, conversationId, initialMessage) => {
    if (conversationId) {
        const conversation = await Conversation.findOne({ _id: conversationId, userId });
        if (conversation) return conversation;
    }
    const title = initialMessage.substring(0, 50) + (initialMessage.length > 50 ? '...' : '');
    return new Conversation({ userId, title, messages: [] });
};

// This flexible helper prepares context for both simple and advanced pipelines
const prepareFinalAnswerContext = (userMessage, searchResults = [], reasoningPlan = '') => {
    const systemPrompt = 'You are a helpful AI assistant. You must provide all your responses in English. Your answer should be in well-formatted Markdown.';
    
    let context = [{ role: 'system', content: systemPrompt }];

    if (searchResults.length > 0) {
        const searchContext = searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n');
        context.push({ role: 'system', content: `Consider these web search results:\n${searchContext}` });
    }
    
    // If there's a reasoning plan, use the detailed prompt
    if (reasoningPlan) {
        const answerPrompt = `Based on the user's query and this reasoning plan, provide a final, expert answer.\n\nUSER QUERY: "${userMessage}"\n\nREASONING PLAN: ${reasoningPlan}`;
        context.push({ role: 'user', content: answerPrompt });
    } else {
        // Otherwise, just use the user's message directly
        context.push({ role: 'user', content: userMessage });
    }
    
    return context;
};

// --- Main Controller Functions ---

const handleChat = asyncHandler(async (req, res) => {
    const { message, conversationId, model = 'kimi-k2', enableSearch = 'false', enableThinking = 'false' } = req.body;
    const imageFile = req.file;

    if (!message && !imageFile) throw new ApiError(400, 'A message or image is required.');
    if (!AI_MODELS[model]) throw new ApiError(400, 'Invalid model selected.');
    
    const conversation = await getOrCreateConversation(req.user._id, conversationId, message || "Image analysis");
    conversation.messages.push({ role: 'user', content: message || `[Image Uploaded: ${imageFile.originalname}]`, hasImage: !!imageFile });

    // --- Vision Model Path (does not use thinking pipeline) ---
    if (imageFile) {
        if (!AI_MODELS[model].capabilities.includes('vision')) {
            throw new ApiError(400, `The selected model '${AI_MODELS[model].name}' does not support image analysis.`);
        }
        const base64Image = imageFile.buffer.toString('base64');
        const finalResponseContent = await analyzeImage(AI_MODELS[model].model, base64Image, imageFile.mimetype, message);
        
        const assistantMessage = { role: 'assistant', content: finalResponseContent, model };
        conversation.messages.push(assistantMessage);
        await conversation.save();
        return res.status(200).json({ conversationId: conversation._id, message: finalResponseContent });
    }

    // --- Text Model Path ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);

    try {
        let finalResponseContent = '';
        let stream;

        // Conditionally choose which pipeline to run based on the frontend toggle
        if (enableThinking === 'true') {
            // --- ADVANCED PIPELINE (with Reasoning) ---
            res.write(`event: thinking\ndata: ${JSON.stringify({ step: "Extended thinking enabled..." })}\n\n`);
            
            let searchResults = [];
            if (enableSearch === 'true') {
                searchResults = await performSearch(message);
                res.write(`event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`);
            }
            
            const reasoningPrompt = `User query: "${message}". Think step-by-step to answer. Wrap thoughts in <reasoning> tags.`;
            const reasoningModel = 'moonshotai/kimi-k2:free';
            const reasoningResponse = await openRouterClient.post('/chat/completions', {
                model: reasoningModel,
                messages: [{ role: 'user', content: reasoningPrompt }],
            });
            const fullReasoningText = reasoningResponse.data.choices[0].message.content;
            const reasoningMatch = fullReasoningText.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
            const extractedReasoning = reasoningMatch ? reasoningMatch[1].trim() : "Starting analysis...";
            res.write(`event: reasoning\ndata: ${JSON.stringify({ reasoning: extractedReasoning })}\n\n`);

            const context = prepareFinalAnswerContext(message, searchResults, extractedReasoning);
            stream = await getChatStream(AI_MODELS[model].model, context);

        } else {
            // --- SIMPLE PIPELINE (Direct Answer) ---
            let searchResults = [];
            if (enableSearch === 'true') {
                 res.write(`event: thinking\ndata: ${JSON.stringify({ step: "Searching..." })}\n\n`);
                 searchResults = await performSearch(message);
                 res.write(`event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`);
            }
            
            const context = prepareFinalAnswerContext(message, searchResults);
            stream = await getChatStream(AI_MODELS[model].model, context);
        }

        // --- Common stream handling for both pipelines ---
        stream.on('data', chunk => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data === '[DONE]') {
                        res.write('event: done\ndata: {}\n\n');
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const token = json.choices[0].delta?.content || '';
                        if (token) {
                            finalResponseContent += token;
                            res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
                        }
                    } catch (e) { /* Ignore parsing errors */ }
                }
            }
        });

        stream.on('end', async () => {
            const assistantMessage = { role: 'assistant', content: finalResponseContent, model };
            conversation.messages.push(assistantMessage);
            await conversation.save();
            res.end();
        });
        
        stream.on('error', (err) => { throw err; });

    } catch (error) {
        console.error("Chat handling error:", error.response ? error.response.data : error.message);
        res.write(`event: error\ndata: ${JSON.stringify({ message: "An error occurred." })}\n\n`);
        res.end();
    }
});


const getAvailableModels = asyncHandler(async (req, res) => {
    res.status(200).json(AI_MODELS);
});

module.exports = { handleChat, getAvailableModels };
