const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProgressUpdate {
  status: 'idle' | 'downloading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  current_clip?: number;
  total_clips?: number;
  threads_used?: number;
  estimated_time_remaining?: number;
  elapsed_time?: number;
}

export interface VideoProcessingResult {
  status: string;
  clip_details: Array<{
    clip_number: number;
    start_time: number;
    end_time: number;
    duration: number;
    filename: string;
  }>;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateShorts(youtubeUrl: string, outputDir: string = 'all_30sec_shorts') {
    return this.request<VideoProcessingResult>(
      '/generate_shorts',
      {
        method: 'POST',
        body: JSON.stringify({
          url: youtubeUrl,
          output_dir: outputDir,
        }),
      }
    );
  }

  async getProgress() {
    return this.request<ProgressUpdate>('/progress');
  }

  /**
   * Check if backend is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }


  /**
   * Delete all clips on backend (Downloads and Outputs)
   */
  async cleanupAll() {
    return this.request<{ success: boolean; message: string }>('/cleanup', {
      method: 'POST',
    });
  }

  /**
   * Compare both backends and choose the best one
   */
  async generateShortsSmart(youtubeUrl: string, outputDir: string = 'all_30sec_shorts') {
    // For now, we default to the 5000 port since that's where our logic is
    return this.generateShorts(youtubeUrl, outputDir);
  }
}

export const apiService = new ApiService();
export default apiService;