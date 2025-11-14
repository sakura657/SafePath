// Environment configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
export const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
export const OPENROUTER_MODEL = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || 'openai/gpt-4-vision-preview';
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
