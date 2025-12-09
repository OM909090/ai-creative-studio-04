export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  blur: number;
  sharpen: number;
  hue: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  adjustments: Partial<ImageAdjustments>;
  thumbnail?: string;
}

export interface EditorState {
  image: string | null;
  originalImage: string | null;
  adjustments: ImageAdjustments;
  activeFilter: string | null;
  history: ImageAdjustments[];
  historyIndex: number;
  zoom: number;
  rotation: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export const defaultAdjustments: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  blur: 0,
  sharpen: 0,
  hue: 0,
};

export const filterPresets: FilterPreset[] = [
  { id: 'none', name: 'None', adjustments: {} },
  { id: 'vivid', name: 'Vivid', adjustments: { saturation: 30, contrast: 15 } },
  { id: 'warm', name: 'Warm', adjustments: { temperature: 25, saturation: 10 } },
  { id: 'cool', name: 'Cool', adjustments: { temperature: -25, saturation: 5 } },
  { id: 'dramatic', name: 'Dramatic', adjustments: { contrast: 40, saturation: -10 } },
  { id: 'fade', name: 'Fade', adjustments: { contrast: -20, brightness: 10 } },
  { id: 'noir', name: 'Noir', adjustments: { saturation: -100, contrast: 30 } },
  { id: 'vintage', name: 'Vintage', adjustments: { saturation: -20, temperature: 15, contrast: -10 } },
];
