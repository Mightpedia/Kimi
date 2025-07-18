const axios = require('axios');
const { OPENROUTER_API_KEY, SITE_URL } = require('../config/env');
const ApiError = require('../utils/ApiError');

const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': SITE_URL,
    'X-Title': 'Kimi Clone API'
  }
});

/**
 * Get a streaming chat response from OpenRouter
 * @param {string} model - The model identifier
 * @param {Array<Object>} messages - The conversation messages
 * @param {Object} options - Additional options like temperature
 * @returns {Stream} - A readable stream of response chunks
 */
const getChatStream = async (model, messages, options = {}) => {
  try {
    const response = await openRouterClient.post('/chat/completions', {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: true,
    }, {
      responseType: 'stream'
    });
    return response.data;
  } catch (error) {
    console.error('OpenRouter Stream API error:', error.response?.data || error.message);
    throw new ApiError(502, 'AI model stream request failed.');
  }
};


/**
 * Analyze an image using a vision model
 * @param {string} base64Image - The base64 encoded image
 * @param {string} mimeType - The mime type of the image
 * @param {string} prompt - The user's prompt
 * @returns {string} - The AI's text response
 */
const analyzeImage = async (base64Image, mimeType, prompt) => {
   try {
    const response = await openRouterClient.post('/chat/completions', {
      model: 'mistralai/mistral-small', // Vision-capable model
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'Describe this image in detail.' },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
        ]
      }],
      max_tokens: 2000
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Image analysis error:', error.response?.data || error.message);
    throw new ApiError(502, 'Image analysis failed.');
  }
};

module.exports = { getChatStream, analyzeImage };