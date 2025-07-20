// controllers/chat.controller.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { AI_MODELS } = require('../config/models');
const { performSearch } = require('../services/serpapi.service');
const { openRouterClient, getChatStream, analyzeImage } = require('../services/openrouter.service');
const Conversation = require('../models/conversation.model');

const getOrCreateConversation = async (userId, conversationId, initialMessage) => {
    if (conversationId) {
        const conversation = await Conversation.findOne({ _id: conversationId, userId });
        if (conversation) return conversation;
    }
    const title = initialMessage.substring(0, 50) + (initialMessage.length > 50 ? '...' : '');
    return new Conversation({ userId, title, messages: [] });
};

const prepareFinalAnswerContext = (reasoningPlan, userMessage) => {
    const systemPrompt = 'You are an expert assistant. Your response must be in English. Provide a comprehensive, well-structured, and expertly written response in clean, well-formatted Markdown. Include code blocks, lists, and bold text where appropriate. Do not include the reasoning tags in your final output.';

    const answerPrompt = `
        Based on the user's query and this reasoning plan, provide the final answer.
        USER QUERY: "${userMessage}"
        
        REASONING PLAN: 
        ${reasoningPlan}
    `;
    
    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: answerPrompt }
    ];
};


const handleChat = asyncHandler(async (req, res) => {
    const { message, conversationId, model = 'kimi-k2', enableSearch = 'false' } = req.body;
    const imageFile = req.file;

    if (!message && !imageFile) throw new ApiError(400, 'A message or image is required.');
    if (!AI_MODELS[model]) throw new ApiError(400, 'Invalid model selected.');
    
    const conversation = await getOrCreateConversation(req.user._id, conversationId, message || "Image analysis");
    conversation.messages.push({ role: 'user', content: message || `[Image Uploaded: ${imageFile.originalname}]`, hasImage: !!imageFile });

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

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);

    try {
        let searchResults = [];
        if (enableSearch === 'true') {
             res.write(`event: thinking\ndata: ${JSON.stringify({ step: "Searching the web..." })}\n\n`);
             searchResults = await performSearch(message);
             res.write(`event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`);
        }
        
        const reasoningPrompt = `
            User's query: "${message}"
            ${searchResults.length > 0 ? `Search results to consider: ${JSON.stringify(searchResults)}` : ''}
            Think step-by-step about how to provide the best possible answer in English. Consider the user's intent, key topics, and the ideal structure for the response (e.g., explanation, code examples, summary).
            Wrap your entire thought process in <reasoning> XML tags.
        `;
        
        // Use a strong reasoning model for this step.
        const reasoningModel = 'moonshotai/kimi-k2:free'; 
        const reasoningResponse = await openRouterClient.post('/chat/completions', {
            model: reasoningModel,
            messages: [{ role: 'user', content: reasoningPrompt }],
        });

        const fullReasoningText = reasoningResponse.data.choices[0].message.content;
        const reasoningMatch = fullReasoningText.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
        const extractedReasoning = reasoningMatch ? reasoningMatch[1].trim() : "Starting analysis...";
        
        res.write(`event: reasoning\ndata: ${JSON.stringify({ reasoning: extractedReasoning })}\n\n`);

        // --- STEP 2: FINAL ANSWER ---
        const context = prepareFinalAnswerContext(extractedReasoning, message);
        
        // Use the model the user selected for the final answer
        const stream = await getChatStream(AI_MODELS[model].model, context);

        let finalResponseContent = '';
        stream.on('data', chunk => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data === '[DONE]') {
                        res.write('event: done\ndata: {}\n\n');
                        return; // Don't end the response here, wait for stream.on('end')
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
            res.end(); // End the connection properly here
        });
        
        stream.on('error', (err) => { throw err; });

    } catch (error) {
        console.error("Advanced chat handling error:", error.response ? error.response.data : error.message);
        res.write(`event: error\ndata: ${JSON.stringify({ message: "An error occurred while processing your request." })}\n\n`);
        res.end();
    }
});


const getAvailableModels = asyncHandler(async (req, res) => {
    res.status(200).json(AI_MODELS);
});

module.exports = { handleChat, getAvailableModels };
