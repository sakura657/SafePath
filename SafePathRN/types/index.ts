// API Response Types
export interface AsrLlmResponse {
  user_text: string;
  assistant_text: string;
  extra?: {
    latency_ms?: number;
    confidence?: number;
  };
}

export interface VlmResponse {
  description: string;
  objects?: string[];
  hazards?: string[];
}

// App State Types
export enum AppMode {
  VOICE_INTERACTION = 'voice_interaction',
  OBSTACLE_DETECTION = 'obstacle_detection',
}

export interface SubtitleData {
  userText: string;
  assistantText: string;
  timestamp: number;
}
