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
    const { url } = await req.json();
    console.log('Parsing link:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    // Step 1: Scrape metadata
    const metadata = await scrapeMetadata(url);
    console.log('Scraped metadata:', metadata);

    // Step 2: Call LLM for classification
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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
            content: 'You are a media classifier. Output ONLY valid JSON. No markdown, no code blocks, just the JSON object.'
          },
          {
            role: 'user',
            content: `Classify this content and output JSON:
Title: ${metadata.title}
Description: ${metadata.description}
URL: ${url}

Output format:
{
  "type": "place" | "recipe" | "outfit" | "tool" | "other",
  "summary": "<max 50 words>",
  "tags": ["tag1", "tag2", "tag3"]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM error:', llmResponse.status, errorText);
      throw new Error(`AI classification failed: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const content = llmData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response, handling markdown code blocks if present
    let classification;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      classification = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', content);
      // Fallback classification
      classification = {
        type: 'other',
        summary: metadata.description?.slice(0, 150) || 'No description available',
        tags: ['link']
      };
    }

    console.log('Classification:', classification);

    // Step 3: Return combined result
    return new Response(JSON.stringify({
      success: true,
      data: {
        url,
        metadata,
        classification,
        parsedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-link function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getVideoThumbnail(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube oEmbed
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);
      if (response.ok) {
        const data = await response.json();
        return data.thumbnail_url;
      }
    }

    // TikTok oEmbed
    if (hostname.includes('tiktok.com')) {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await fetch(oembedUrl);
      if (response.ok) {
        const data = await response.json();
        return data.thumbnail_url;
      }
    }

    // Instagram oEmbed
    if (hostname.includes('instagram.com')) {
      const oembedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=YOUR_ACCESS_TOKEN`;
      // Note: Instagram requires an access token
      // For now, rely on og:image from scraping
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching video thumbnail:', error);
    return null;
  }
}

async function scrapeMetadata(url: string) {
  try {
    // First try to get video thumbnail via oEmbed
    const videoThumbnail = await getVideoThumbnail(url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    const getMetaContent = (name: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, 'i'),
        new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMetaContent('og:title') || 
                  getMetaContent('twitter:title') || 
                  (titleMatch ? titleMatch[1] : null) ||
                  'Untitled';

    const description = getMetaContent('og:description') || 
                       getMetaContent('twitter:description') || 
                       getMetaContent('description') ||
                       '';

    // Prioritize video thumbnail from oEmbed, then fall back to meta tags
    const image = videoThumbnail ||
                  getMetaContent('og:image') || 
                  getMetaContent('twitter:image') ||
                  getMetaContent('og:image:url') ||
                  getMetaContent('twitter:image:src');

    const siteName = getMetaContent('og:site_name') || 
                    new URL(url).hostname;

    return {
      title: title.trim(),
      description: description.trim(),
      image,
      siteName,
    };
  } catch (error) {
    console.error('Error scraping metadata:', error);
    
    const fallbackThumbnail = await getVideoThumbnail(url);
    
    return {
      title: 'Failed to load',
      description: 'Could not fetch page metadata',
      image: fallbackThumbnail,
      siteName: new URL(url).hostname,
    };
  }
}

