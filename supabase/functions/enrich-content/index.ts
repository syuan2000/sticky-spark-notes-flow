// supabase/functions/enrich-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Category-specific prompts
    const prompts: Record<string, string> = {
      place: `Extract structured information about this place: "${title}" (${url})

Return ONLY this format (use "Not available" if info not found):
**Address:** [full address]
**Hours:** [operating hours]
**Features:** [key highlights in 2-3 bullet points]`,

      recipe: `Extract structured information about this recipe: "${title}" (${url})

Return ONLY this format:
**Prep Time:** [time]
**Cook Time:** [time]
**Servings:** [number]
**Key Ingredients:** [main ingredients]
**Steps:** [brief overview]`,

      outfit: `Extract structured information about this outfit/product: "${title}" (${url})

Return ONLY this format:
**Price:** [price or range]
**Where to Buy:** [store/link]
**Sizes:** [available sizes]
**Style Notes:** [2-3 key points]`,

      tool: `Extract structured information about this tool/software: "${title}" (${url})

Return ONLY this format:
**Pricing:** [free/paid/subscription]
**Platform:** [web/iOS/Android/desktop]
**Key Features:** [3-4 main features]
**Best For:** [target audience]
**Alternatives:** [similar tools]`,

      other: `Extract key structured information about: "${title}" (${url})

Provide the most relevant details in a clean, organized format.`
    };

    const prompt = prompts[type as keyof typeof prompts] || prompts.other;

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
            content: 'You are a concise information extractor. Provide structured, factual data only. No fluff or introductions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      }),
    });

    if (!llmResponse.ok) {
      throw new Error('Failed to enrich content');
    }

    const llmData = await llmResponse.json();
    const enrichedContent = llmData.choices?.[0]?.message?.content || 'No additional information available';

    return new Response(JSON.stringify({
      success: true,
      data: { enrichedContent }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});