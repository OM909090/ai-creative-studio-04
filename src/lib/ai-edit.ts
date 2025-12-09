import { supabase } from '@/integrations/supabase/client';
import { ImageAdjustments } from '@/types/editor';

export interface AIEditResponse {
  adjustments: Partial<ImageAdjustments>;
  explanation: string;
  filter?: string | null;
  error?: string;
}

export async function processAIEditCommand(
  message: string,
  currentAdjustments?: ImageAdjustments
): Promise<AIEditResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-edit', {
      body: { message, currentAdjustments },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to process AI command');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as AIEditResponse;
  } catch (err) {
    console.error('AI edit error:', err);
    throw err;
  }
}
