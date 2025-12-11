/**
 * Enhanced AI Command Processor
 * Handles web environment control commands with comprehensive validation and routing
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
}

interface AIWebCommandRequest {
  message: string;
  userContext?: Record<string, any>;
  currentPermissions?: string[];
}

interface AIWebCommandResponse {
  actionType: string;
  actionDetails: string;
  parameters: Record<string, any>;
  explanation: string;
  requiresConfirmation: boolean;
  scopeValidation: {
    withinScope: boolean;
    reason: string;
    permissionsRequired: string[];
    suggestedAlternative?: string;
  };
  timestamp?: string;
  status?: string;
  executionId?: string;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced system prompt for web environment control
const SYSTEM_PROMPT = `You are an advanced AI web environment controller for PixelForge AI. Your role is to interpret natural language commands and translate them into executable actions within the web environment.

You MUST respond with a valid JSON object containing these fields:
- actionType: The type of action to perform (web_automation, browser_control, system_control, editing, information)
- actionDetails: Specific details about the action to perform
- parameters: Any required parameters for the action
- explanation: A brief friendly message explaining what you will do
- requiresConfirmation: Boolean indicating if user confirmation is needed
- scopeValidation: Object describing the scope and permissions required

Available action types:
1. web_automation - Automate web interactions (form filling, data extraction, etc.)
2. browser_control - Control browser functions (navigation, tabs, bookmarks)
3. system_control - System-level operations (file management, process control)
4. editing - Image/video editing operations (current functionality)
5. information - Provide information or answer questions

Scope validation rules:
- All actions must be within the web environment scope
- No actions that could harm user data or system integrity
- No actions outside the application's intended functionality
- User must have appropriate permissions for requested actions

Example user request: "Open a new tab and search for AI tools"
Example response:
{
  "actionType": "browser_control",
  "actionDetails": "open_new_tab_and_search",
  "parameters": {
    "searchQuery": "AI tools",
    "newTab": true
  },
  "explanation": "I will open a new browser tab and perform a search for AI tools.",
  "requiresConfirmation": false,
  "scopeValidation": {
    "withinScope": true,
    "reason": "Browser navigation is within web environment control scope",
    "permissionsRequired": ["browser.navigation", "browser.tabs"]
  }
}

Example user request: "Extract all product names from the current page"
Example response:
{
  "actionType": "web_automation",
  "actionDetails": "extract_data",
  "parameters": {
    "dataType": "product_names",
    "selector": ".product-title",
    "currentPage": true
  },
  "explanation": "I will extract all product names from the current web page using the specified CSS selector.",
  "requiresConfirmation": true,
  "scopeValidation": {
    "withinScope": true,
    "reason": "Data extraction from current page is within scope",
    "permissionsRequired": ["web.data_extraction", "current_page.access"]
  }
}

Always respond with ONLY the JSON object, no markdown formatting or additional text.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders as Record<string, string> });
  }

  try {
    const { message, userContext, currentPermissions } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // @ts-ignore - Deno is available in the runtime environment
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI web command:', message);
    console.log('User context:', userContext);
    console.log('Current permissions:', currentPermissions);

    // Enhanced user prompt with context and permissions
    const userPrompt = `
User request: "${message}"

User context: ${JSON.stringify(userContext || {})}

Current permissions: ${JSON.stringify(currentPermissions || [])}

Available permissions: ${JSON.stringify([
      "web.data_extraction", "web.form_filling", "web.navigation",
      "browser.tabs", "browser.bookmarks", "browser.history",
      "browser.navigation", "browser.settings",
      "system.file_read", "system.file_write", "system.process_info",
      "editing.image", "editing.video", "editing.audio",
      "information.general", "information.technical"
    ])}

Please analyze this request and provide the appropriate action plan.
Consider the user's permissions and only suggest actions they are authorized for.
If the request is outside the web environment scope, explain why it cannot be fulfilled.
`;

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
    let parsedResponse: AIWebCommandResponse;
    try {
      // Clean up the response in case it has markdown formatting
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedContent) as AIWebCommandResponse;

      // Validate the response structure
      const requiredFields = ['actionType', 'actionDetails', 'parameters', 'explanation', 'requiresConfirmation', 'scopeValidation'];
      const missingFields = requiredFields.filter((field: string) => !(field in parsedResponse));

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate scope and permissions
      if (!parsedResponse.scopeValidation.withinScope) {
        return new Response(
          JSON.stringify({
            error: 'Request outside of scope',
            reason: parsedResponse.scopeValidation.reason || 'Action not permitted in web environment',
            suggestedAlternative: parsedResponse.scopeValidation.suggestedAlternative || null
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user has required permissions
      const requiredPermissions = parsedResponse.scopeValidation.permissionsRequired || [];
      const missingPermissions = requiredPermissions.filter((perm: string) => !currentPermissions?.includes(perm));

      if (missingPermissions.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient permissions',
            missingPermissions: missingPermissions,
            explanation: parsedResponse.explanation
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

    console.log('Parsed AI web command response:', parsedResponse);

    // Add execution metadata
    const enhancedResponse = {
      ...parsedResponse,
      timestamp: new Date().toISOString(),
      status: 'ready_for_execution',
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    };

    return new Response(
      JSON.stringify(enhancedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-web-command function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});