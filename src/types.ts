export interface DubbingSegment {
  id: number;
  start: number;
  end: number;
  original: string;
  translation: string;
  isTranslating?: boolean;
  audioUrl?: string;
  isSynthesizing?: boolean;
}

export interface VoiceCloneProfile {
  id: string;
  name: string;
  speaker: string;
  gender: 'male' | 'female';
  geminiVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  description: string;
  matchScore: number;
}

export interface YouTubeInfo {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  embedUrl: string;
}

export interface AnalyzeRequest {
  youtubeUrl?: string;
  srtContent?: string;
  videoFileName?: string;
  engine: 'gemini' | 'ollama';
  apiKey?: string;
  speedMode?: 'turbo' | 'standard';
  toneStyle?: 'natural' | 'compact' | 'tech';
}

export interface AnalyzeResponse {
  logs: string[];
  segments: DubbingSegment[];
  videoUrl?: string;
  durationMs?: number;
}

export interface SynthesizeRequest {
  segments: DubbingSegment[];
  videoUrl?: string;
  voiceProfileId?: string;
  apiKey?: string;
}

export interface SynthesizeResponse {
  logs: string[];
  success: boolean;
  videoUrl?: string;
  segments?: DubbingSegment[];
  audioSegments?: {
    id: number;
    start: number;
    end: number;
    text: string;
    audioUrl?: string;
  }[];
}
