// Environment configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
export const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
export const OPENROUTER_MODEL = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite-preview-09-2025';
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_SITE_URL = 'https://safepath.app';
export const OPENROUTER_APP_NAME = 'SafePath Navigation Assistant';
