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
  'kimi-dev-72b': {
    name: 'Kimi Dev 72B',
    provider: 'openrouter',
    model: 'moonshotai/kimi-dev-72b:free',
    capabilities: ['text', 'coding', 'engineering'],
    description: 'Specialized for software engineering tasks'
  },
  'qwen3-30b': {
    name: 'Qwen3 30B A3B',
    provider: 'openrouter',
    model: 'qwen/qwen3-30b-a3b:free',
    capabilities: ['text', 'reasoning', 'multilingual'],
    description: 'Versatile model with thinking and dialogue modes'
  },
  'mistral-small': {
    name: 'Mistral Small 3.1 24B',
    provider: 'openrouter',
    model: 'mistralai/mistral-small-3.1-24b-instruct:free',
    capabilities: ['text', 'vision', 'multilingual'],
    description: 'Multimodal model with vision capabilities'
  },
  'reka-flash-3': {
    name: 'Reka Flash 3',
    provider: 'openrouter',
    model: 'rekaai/reka-flash-3:free',
    capabilities: ['text', 'reasoning', 'coding'],
    description: 'Fast and efficient general-purpose model'
  },
  'hunyuan-a13b': {
    name: 'Hunyuan A13B',
    provider: 'openrouter',
    model: 'tencent/hunyuan-a13b-instruct:free',
    capabilities: ['text', 'reasoning', 'chain-of-thought'],
    description: 'MoE model with chain-of-thought reasoning'
  }
};

module.exports = { AI_MODELS };