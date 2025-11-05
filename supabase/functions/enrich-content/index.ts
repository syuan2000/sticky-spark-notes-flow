import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, url } = await req.json();
    console.log('Enriching content:', { type, title, url });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build prompt based on type
    let prompt = '';
    switch (type) {
      case 'place':
        prompt = `Find detailed information about "${title}". Include: address, rating, hours, whether it has outlets/parking, and menu/key features. Be concise but thorough.`;
        break;
      case 'recipe':
        prompt = `Extract or find the ingredients list and cooking steps for "${title}". Format clearly with ingredients first, then numbered steps.`;
        break;
      case 'outfit':
      case 'product':
        prompt = `Find similar products or alternatives to "${title}". List 3-5 options with brief descriptions and approximate price ranges.`;
        break;
      case 'tool':
        prompt = `Provide a brief review summary and key pros/cons of "${title}". Include typical use cases and pricing if available.`;
        break;
      default:
        prompt = `Provide more detailed information about "${title}". Be specific and helpful.`;
    }

    const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides concise, structured information. Format your response clearly with headings and bullet points where appropriate.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM error:', llmResponse.status, errorText);
      
      if (llmResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (llmResponse.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      throw new Error(`AI enrichment failed: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const enrichedContent = llmData.choices?.[0]?.message?.content;

    if (!enrichedContent) {
      throw new Error('No response from AI');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        enrichedContent,
        enrichedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-content function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: error instanceof Error && error.message.includes('Rate limit') ? 429 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});