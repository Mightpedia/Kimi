const { getJson } = require('google-search-results-nodejs');
const { SERPAPI_KEY } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Performs a web search using SerpApi
 * @param {string} query The search query
 * @param {object} options Search options (num, hl, gl)
 * @returns {Promise<Array>} A promise that resolves to search results
 */
const performSearch = async (query, options = {}) => {
  if (!SERPAPI_KEY) {
    console.error("SerpApi Error: SERPAPI_KEY is not defined in environment variables.");
    throw new ApiError(500, "Web search service is not configured.");
  }

  const params = {
    q: query,
    api_key: SERPAPI_KEY, // The API key is passed directly in the parameters
    engine: 'google',
    num: options.num || 5,
    hl: options.language || 'en',
    gl: options.country || 'us'
  };

  return new Promise((resolve, reject) => {
    getJson(params, (data) => {
      if (data.error) {
        console.error('SerpApi Error:', data.error);
        reject(new ApiError(502, 'Web search service failed.'));
      } else {
        resolve(data.organic_results || []);
      }
    });
  });
};

module.exports = { performSearch };
