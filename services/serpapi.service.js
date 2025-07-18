const { SerpApi } = require('google-search-results-nodejs');
const { SERPAPI_KEY } = require('../config/env');
const ApiError = require('../utils/ApiError');

const searchClient = new SerpApi(SERPAPI_KEY);

/**
 * Performs a web search using SerpApi
 * @param {string} query The search query
 * @param {object} options Search options (num, hl, gl)
 * @returns {Promise<Array>} A promise that resolves to search results
 */
const performSearch = async (query, options = {}) => {
  const params = {
    q: query,
    engine: 'google',
    num: options.num || 5,
    hl: options.language || 'en',
    gl: options.country || 'us'
  };

  return new Promise((resolve, reject) => {
    searchClient.search(params, (data) => {
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