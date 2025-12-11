export type InputModality = 'text' | 'voice' | 'image' | 'gesture' | 'handwriting';
export type VoiceCommandStatus = 'listening' | 'processing' | 'recognized' | 'error';
export type GestureType = 'swipe' | 'pinch' | 'long-press' | 'double-tap' | 'rotate' | 'drag';
export type RecognitionLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ar' | 'pt';

export interface VoiceInput {
  id: string;
  userId: string;
  audioData: Blob;
  duration: number;
  language: RecognitionLanguage;
  confidence: number;
  transcript: string;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  timestamp: string;
}

export interface VoiceRecognitionResult {
  id: string;
  transcript: string;
  confidence: number;
  commandIntent: string;
  parameters: Record<string, any>;
  language: RecognitionLanguage;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface GestureInput {
  id: string;
  type: GestureType;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  duration: number;
  velocity: number;
  scale?: number;
  rotation?: number;
  force?: number;
  timestamp: string;
}

export interface ImageInput {
  id: string;
  userId: string;
  imageData: Blob;
  format: 'jpeg' | 'png' | 'webp' | 'bmp';
  width: number;
  height: number;
  size: number;
  timestamp: string;
  metadata: {
    camera?: string;
    location?: { latitude: number; longitude: number };
    timestamp?: string;
  };
}

export interface ImageRecognitionResult {
  id: string;
  imageId: string;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
  text: string;
  faces: Array<{
    bbox: { x: number; y: number; width: number; height: number };
    emotions: Record<string, number>;
  }>;
  colors: Array<{
    hex: string;
    percentage: number;
    name: string;
  }>;
  descriptions: string[];
}

export interface HandwritingInput {
  id: string;
  strokes: Array<{
    points: Array<{ x: number; y: number; pressure: number; time: number }>;
    timeStarted: number;
  }>;
  duration: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  timestamp: string;
}

export interface HandwritingRecognitionResult {
  id: string;
  handwritingId: string;
  text: string;
  confidence: number;
  alternatives: Array<{
    text: string;
    confidence: number;
  }>;
  language: RecognitionLanguage;
  style: {
    isItalic: boolean;
    isBold: boolean;
    isUnderlined: boolean;
  };
}

export interface MultimodalCommand {
  id: string;
  userId: string;
  modalities: InputModality[];
  text?: string;
  voice?: VoiceInput;
  image?: ImageInput;
  gesture?: GestureInput;
  handwriting?: HandwritingInput;
  processedAt: string;
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
}

export interface SpeechSynthesisConfig {
  language: RecognitionLanguage;
  voice: string;
  pitch: number;
  rate: number;
  volume: number;
}

export interface AudioResponse {
  id: string;
  text: string;
  audioData?: Blob;
  duration?: number;
  generatedAt: string;
  language: RecognitionLanguage;
}

export interface InputMode {
  modality: InputModality;
  enabled: boolean;
  priority: number;
  confidence: number;
  processingLatency: number;
}

export interface MultimodalConfig {
  enabledModalities: InputModality[];
  voiceConfig: {
    enabled: boolean;
    language: RecognitionLanguage;
    continuousMode: boolean;
    interimResults: boolean;
  };
  gestureConfig: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    recognizedGestures: GestureType[];
  };
  imageConfig: {
    enabled: boolean;
    maxFileSize: number;
    formats: string[];
    enableOCR: boolean;
    enableObjectDetection: boolean;
  };
  handwritingConfig: {
    enabled: boolean;
    language: RecognitionLanguage;
    style: 'print' | 'cursive' | 'mixed';
  };
  feedbackConfig: {
    audioFeedback: boolean;
    hapticFeedback: boolean;
    visualFeedback: boolean;
  };
}

export interface ModalityProbability {
  modality: InputModality;
  probability: number;
  confidence: number;
}

export interface CommandParsing {
  id: string;
  input: MultimodalCommand;
  parsedIntent: string;
  extractedEntities: Array<{
    name: string;
    value: any;
    type: string;
  }>;
  parameters: Record<string, any>;
  confidence: number;
  alternatives: Array<{
    intent: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
}
