// controllers/chatController.js
const axios = require('axios');
const Chat = require('../models/Chat');
const logger = require('../utils/logger');

// This array now includes all the new models you provided.
const FREE_MODELS = (process.env.OPENROUTER_FREE_MODELS || [
  'mistralai/mistral-7b-instruct:free',
  'tencent/hunyuan-a13b-instruct:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'moonshotai/kimi-dev-72b:free',
  'qwen/qwen3-32b:free',
  'qwen/qwen3-235b-a22b:free',
  'moonshotai/kimi-vl-a3b-thinking:free',
  'rekaai/reka-flash-3:free',
  'deepseek/deepseek-chat:free',
  'deepseek/deepseek-r1:free'
].join(',')).split(',');

// Web search function (remains unchanged)
async function performWebSearch(query) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { q: query, api_key: process.env.SERPAPI_KEY, num: 5, engine: 'google' },
      timeout: 10000
    });
    return response.data.organic_results?.map(result => ({
      title: result.title,
      snippet: result.snippet,
      url: result.link
    })) || [];
  } catch (error) {
    logger.error('Web search error:', error);
    return [];
  }
}

// Prompt building functions (remains unchanged)
function getExtendedReasoningPrompt() {
  return `You are an AI assistant that thinks step-by-step...`; // (content omitted for brevity)
}

function buildPrompt(userPrompt, webResults = [], extendedReasoning = false) {
  let systemPrompt = '';
  if (extendedReasoning) systemPrompt = getExtendedReasoningPrompt();
  let finalPrompt = userPrompt;
  if (webResults.length > 0) {
    const webContext = webResults.map(r => `Title: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n');
    finalPrompt = `Based on these search results, answer "${userPrompt}":\n\n${webContext}`;
  }
  return { systemPrompt, finalPrompt };
}


// --- NEW STREAMING CHAT HANDLER ---
const handleChat = async (req, res) => {
  const { prompt, useWebSearch = false, extendedReasoning = false, model = FREE_MODELS[0] } = req.body;
  const userId = req.user._id;
  let finalResponseContent = '';
  let searchResults = [];

  try {
    // 1. Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 2. Perform web search if enabled and stream results
    if (useWebSearch) {
      searchResults = await performWebSearch(prompt);
      res.write(`event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`);
    }

    // 3. Prepare the context and messages for the AI model
    const { systemPrompt, finalPrompt } = buildPrompt(prompt, searchResults, extendedReasoning);
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: finalPrompt });

    // 4. Make the streaming request to OpenRouter
    const streamResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: FREE_MODELS.includes(model) ? model : FREE_MODELS[0],
      messages,
      stream: true, // Enable streaming
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
      responseType: 'stream'
    });

    // 5. Process the stream chunk by chunk
    streamResponse.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') {
            res.write('event: done\ndata: {}\n\n');
            return; // The stream is finished, but we wait for the 'end' event to save
          }
          try {
            const json = JSON.parse(data);
            const token = json.choices[0].delta?.content || '';
            if (token) {
              finalResponseContent += token;
              res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
            }
          } catch (e) {
            logger.error('Error parsing stream data chunk:', e);
          }
        }
      }
    });

    // 6. Handle the end of the stream to save the conversation
    streamResponse.data.on('end', async () => {
      if (finalResponseContent) {
        const chat = new Chat({
          userId,
          prompt,
          response: finalResponseContent,
          useWebSearch,
          extendedReasoning,
          webSearchResults: searchResults,
          model
        });
        await chat.save();
        // Send the final chat ID to the client
        res.write(`event: metadata\ndata: ${JSON.stringify({ chatId: chat._id })}\n\n`);
      }
      res.end(); // Close the connection
    });

    // 7. Handle any errors during the stream
    streamResponse.data.on('error', (err) => {
      logger.error("Stream error:", err);
      res.write(`event: error\ndata: ${JSON.stringify({ message: "An error occurred during the stream." })}\n\n`);
      res.end();
    });

  } catch (error) {
    logger.error('Chat handler error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ message: "Failed to start chat stream." })}\n\n`);
    res.end();
  }
};

// Gets the list of available AI models
const getAvailableModels = (req, res) => {
  try {
    res.status(200).json({ models: FREE_MODELS });
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models.' });
  }
};

module.exports = {
  handleChat,
  getAvailableModels
};
