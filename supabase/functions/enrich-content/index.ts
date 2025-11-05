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

    const systemPrompt = `You are an assistant that provides concise, structured enrichment data for short-form media (Instagram, TikTok, YouTube, blog, etc.).
Your goal is to output a compact JSON object (or array of objects if multiple items are mentioned) with the most relevant, factual highlights (max 5 per item).

Expected Output Schema for SINGLE item:
{
  "name": "",
  "category": "",
  "address": "",
  "map_url": "",
  "hours": "",
  "key_info": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]
}

Expected Output Schema for MULTIPLE items:
{
  "items": [
    { "name": "", "category": "", "address": "", "map_url": "", "hours": "", "key_info": [...] },
    { "name": "", "category": "", "address": "", "map_url": "", "hours": "", "key_info": [...] }
  ]
}

Category-Specific Guidelines:

1️⃣ Place (café, restaurant, shop, travel spot)
Return at most 5 of these if available:
- Signature / hype item
- Current seasonal or limited menu item
- Work-friendliness (Wi-Fi, outlets, time limit)
- Crowd or queue pattern
- Parking situation
(Always include address + hours + map URL if known)

2️⃣ Recipe / Food Idea
- Key ingredients
- time to prep + cook
- Serving suggestion
- Nutrition or dietary tag

3️⃣ Outfit / Product
- Core clothing / item names
- Brand or store
- Style keywords (season, occasion, aesthetic)
- Trending element (color, fit, material)
- Price range / availability note

4️⃣ Makeup / Beauty
- Product name & brand
- Shade or variant used
- Skin type or finish (glowy, matte, dewy)
- Application tip / tool
- Dupe or alternative suggestion

5️⃣ Tool / Gadget
- Core function or use case
- Key features / specs
- Pros or unique advantage
- Common alternatives / price tier
- Real-life use example

6️⃣ Other / Inspiration
Summarize 3–5 main ideas or themes only.

Style Rules:
- Be factual and concise
- Keep values ≤ 100 characters each
- Use null for unknown fields
- Generate only the JSON object; no markdown or explanation
- If multiple places/items are mentioned, return them in an "items" array`;

    const userPrompt = `Extract enrichment data from this ${type} content:
Title: "${title}"
URL: ${url}

If there are multiple places/items/products mentioned, return them all in an "items" array.
Return ONLY valid JSON, no markdown.`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!llmResponse.ok) {
      throw new Error('Failed to enrich content');
    }

    const llmData = await llmResponse.json();
    let content = llmData.choices?.[0]?.message?.content || '{}';
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    let structuredData;
    try {
      structuredData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON:', content);
      throw new Error('Failed to parse enriched data');
    }

    return new Response(JSON.stringify({
      success: true,
      data: { 
        enrichedContent: structuredData,
        type: type
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});