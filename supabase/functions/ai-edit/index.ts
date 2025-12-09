import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI photo editing assistant for PixelForge AI. Your role is to interpret natural language editing commands and translate them into precise adjustment values.

You MUST respond with a valid JSON object containing these fields:
- adjustments: An object with numeric values for these properties (all values should be between -100 and 100 except blur 0-20, hue -180 to 180):
  - brightness: number (-100 to 100)
  - contrast: number (-100 to 100)
  - saturation: number (-100 to 100)
  - exposure: number (-100 to 100)
  - temperature: number (-100 to 100, positive = warm/orange, negative = cool/blue)
  - hue: number (-180 to 180)
  - blur: number (0 to 20)
  - sharpen: number (0 to 100)
- explanation: A brief friendly message explaining what adjustments you made
- filter: Optional string, one of: "none", "vivid", "warm", "cool", "dramatic", "fade", "noir", "vintage"

Example user request: "Make it look like a sunset"
Example response:
{
  "adjustments": {
    "brightness": 10,
    "contrast": 15,
    "saturation": 25,
    "exposure": 5,
    "temperature": 40,
    "hue": 15,
    "blur": 0,
    "sharpen": 0
  },
  "explanation": "I've warmed up the colors with orange/golden tones, increased saturation for vibrant sunset colors, and boosted contrast for a dramatic sky effect.",
  "filter": null
}

Example user request: "Remove the blue tint and add warmth"
Example response:
{
  "adjustments": {
    "brightness": 0,
    "contrast": 5,
    "saturation": 10,
    "exposure": 0,
    "temperature": 35,
    "hue": 10,
    "blur": 0,
    "sharpen": 0
  },
  "explanation": "I've shifted the temperature toward warm tones to remove the blue cast and added a slight hue shift toward orange for a cozy, warm feel.",
  "filter": null
}

Example user request: "Make it black and white with high contrast"
Example response:
{
  "adjustments": {
    "brightness": 0,
    "contrast": 40,
    "saturation": -100,
    "exposure": 0,
    "temperature": 0,
    "hue": 0,
    "blur": 0,
    "sharpen": 10
  },
  "explanation": "I've completely desaturated the image for a classic black and white look, boosted contrast for drama, and added slight sharpening for crisp details.",
  "filter": "noir"
}

Always respond with ONLY the JSON object, no markdown formatting or additional text.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, currentAdjustments } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI edit request:', message);
    console.log('Current adjustments:', currentAdjustments);

    const userPrompt = currentAdjustments 
      ? `Current image adjustments: ${JSON.stringify(currentAdjustments)}\n\nUser request: "${message}"\n\nPlease provide the new adjustment values based on this request. Consider the current values and adjust accordingly.`
      : `User request: "${message}"\n\nPlease provide the adjustment values for this editing request.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to process AI request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI Gateway response:', JSON.stringify(data));

    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let parsedResponse;
    try {
      // Clean up the response in case it has markdown formatting
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ 
          error: 'Could not understand AI response',
          rawResponse: aiContent 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed AI response:', parsedResponse);

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-edit function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
