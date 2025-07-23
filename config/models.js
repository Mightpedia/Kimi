const AI_MODELS = {
  'deepseek-r1': {
    name: 'DeepSeek R1',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1:free',
    capabilities: ['text', 'reasoning', 'thinking'],
    description: 'Advanced reasoning model with thinking capabilities'
  },
  'deepseek-r1-qwen3': {
    name: 'DeepSeek R1 Qwen3 8B',
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
    capabilities: ['text', 'reasoning', 'thinking'],
    description: 'Efficient reasoning model with 8B parameters'
  },
  'qwen3-30b': {
    name: 'Qwen3 30B A3B',
    provider: 'openrouter',
    model: 'qwen/qwen3-30b-a3b:free',
    capabilities: ['text', 'reasoning', 'multilingual'],
    description: 'Versatile model with thinking and dialogue modes'
  },
  'qwen3-235b': {
    name: 'Qwen3 235B A22B 2507',
    provider: 'openrouter',
    model: 'qwen/qwen3-235b-a22b-07-25:free',
    capabilities: ['text', 'reasoning', 'multilingual', 'math', 'coding'],
    description: '262K context multilingual Mixture-of-Experts model (22B active). Excellent at long-context reasoning, math, and code.'
  },
  'mistral-small': {
    name: 'Mistral Small 3.1 24B',
    provider: 'openrouter',
    model: 'mistralai/mistral-small-3.1-24b-instruct:free',
    capabilities: ['text', 'vision', 'multilingual'],
    description: 'Multimodal model with vision capabilities'
  },
  'mistral-7b': {
    name: 'Mistral 7B Instruct',
    provider: 'openrouter',
    model: 'mistralai/mistral-7b-instruct:free',
    capabilities: ['text', 'reasoning'],
    description: 'High-performing 7.3B model optimized for speed and context length'
  },
  'reka-flash-3': {
    name: 'Reka Flash 3',
    provider: 'openrouter',
    model: 'rekaai/reka-flash-3:free',
    capabilities: ['text', 'reasoning', 'coding'],
    description: 'Fast and efficient general-purpose model'
  },
  'devstral-small': {
    name: 'Devstral Small (24B)',
    provider: 'openrouter',
    model: 'mistralai/devstral-small-2505:free',
    capabilities: ['text', 'coding', 'agentic'],
    description: 'Specialized for advanced software engineering tasks.'
  },
  'glm-z1-32b': {
    name: 'GLM-Z1 Reasoning (32B)',
    provider: 'openrouter',
    model: 'thudm/glm-z1-32b:free',
    capabilities: ['text', 'reasoning', 'coding', 'math'],
    description: 'Enhanced reasoning variant for deep logical problem solving.'
  },
  'mai-ds-r1': {
    name: 'Microsoft MAI DS R1',
    provider: 'openrouter',
    model: 'microsoft/mai-ds-r1:free',
    capabilities: ['text', 'reasoning', 'coding'],
    description: 'Reasoning model with enhanced safety and unblocking.'
  },
  'gemma-3n-2b': {
    name: 'Google Gemma 3n (2B)',
    provider: 'openrouter',
    model: 'google/gemma-3n-e2b-it:free',
    capabilities: ['text', 'multilingual', 'reasoning'],
    description: 'Efficient multimodal model for low-resource deployment.'
  },
  'deepseek-v3-base': {
    name: 'DeepSeek V3 Base',
    provider: 'openrouter',
    model: 'deepseek/deepseek-v3-base:free',
    capabilities: ['text', 'reasoning', 'math', 'coding'],
    description: '671B MoE model with 128K context. Requires detailed prompting.'
  },
  'qwerky-72b': {
    name: 'Qwerky 72B',
    provider: 'openrouter',
    model: 'featherless/qwerky-72b:free',
    capabilities: ['text', 'reasoning', 'multilingual'],
    description: 'Linear-attention 72B model with efficient large-context inference'
  },
  'llama-3.3-70b': {
    name: 'LLaMA 3.3 70B Instruct',
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    capabilities: ['text', 'multilingual', 'reasoning'],
    description: 'Multilingual 70B model optimized for dialogue and industry benchmarks'
  }
};

module.exports = { AI_MODELS };
