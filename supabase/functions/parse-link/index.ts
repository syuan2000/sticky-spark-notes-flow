import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");
    console.log("Parsing link:", url);

    const metadata = await scrapeMetadata(url);
    console.log("Scraped metadata:", metadata);

    // If we got good metadata from oEmbed, skip LLM classification
    const hostname = new URL(url).hostname.toLowerCase();
    if ((hostname.includes('instagram.com') || hostname.includes('youtube.com') || 
         hostname.includes('youtu.be') || hostname.includes('tiktok.com')) && metadata.fromOembed) {
      return jsonResponse({
        success: true,
        data: {
          url,
          metadata,
          classification: {
            type: "other",
            summary: metadata.description || "View content on platform",
            tags: [metadata.siteName.toLowerCase()],
          },
          parsedAt: new Date().toISOString(),
        },
      });
    }

    // ── LLM classification ───────────────────────────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const llmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a media classifier. Output ONLY valid JSON with this format: {\"type\": \"place|recipe|outfit|tool|other\", \"summary\": \"<max 50 words>\", \"tags\": [\"tag1\", \"tag2\", \"tag3\"]}. No markdown, no code blocks.",
          },
          {
            role: "user",
            content: `Classify this link:
Title: "${metadata.title}"
Description: "${metadata.description}"
URL: ${url}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    const data = await llmResponse.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    let classification;
    try {
      classification = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      classification = {
        type: "other",
        summary: metadata.description?.slice(0, 100) ?? "No description",
        tags: ["link"],
      };
    }

    console.log("Classification:", classification);

    return jsonResponse({
      success: true,
      data: { url, metadata, classification, parsedAt: new Date().toISOString() },
    });
  } catch (e) {
    console.error("Error in parse-link:", e);
    return jsonResponse(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ──────────────────────────────────────────────────────────────
// Instagram oEmbed (official API - NO authentication required for public posts)
async function getInstagramOembed(url: string) {
  try {
    // Instagram's public oEmbed endpoint - no auth needed!
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
    console.log('Fetching Instagram oEmbed:', oembedUrl);
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Instagram oEmbed success:', data);
      return {
        title: data.title || "Instagram post",
        description: data.author_name ? `By ${data.author_name}` : "",
        thumbnail: data.thumbnail_url,
        author: data.author_name,
        fromOembed: true,
      };
    } else {
      console.error('Instagram oEmbed failed:', response.status, await response.text());
    }
  } catch (err) {
    console.error("Instagram oEmbed error:", err);
  }
  return null;
}

// YouTube oEmbed
async function getYouTubeOembed(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        thumbnail: data.thumbnail_url,
        author: data.author_name,
        fromOembed: true,
      };
    }
  } catch (err) {
    console.error("YouTube oEmbed error:", err);
  }
  return null;
}

// TikTok oEmbed
async function getTikTokOembed(url: string) {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        thumbnail: data.thumbnail_url,
        author: data.author_name,
        fromOembed: true,
      };
    }
  } catch (err) {
    console.error("TikTok oEmbed error:", err);
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Main metadata scraper
async function scrapeMetadata(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();

  // Try platform-specific oEmbed APIs first
  let oembedData = null;
  
  if (hostname.includes("instagram.com")) {
    oembedData = await getInstagramOembed(url);
    if (oembedData) {
      return {
        title: oembedData.title,
        description: oembedData.description,
        image: oembedData.thumbnail,
        siteName: "Instagram",
        fromOembed: true,
      };
    }
  }
  
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    oembedData = await getYouTubeOembed(url);
    if (oembedData) {
      return {
        title: oembedData.title,
        description: `By ${oembedData.author}`,
        image: oembedData.thumbnail,
        siteName: "YouTube",
        fromOembed: true,
      };
    }
  }
  
  if (hostname.includes("tiktok.com")) {
    oembedData = await getTikTokOembed(url);
    if (oembedData) {
      return {
        title: oembedData.title,
        description: `By ${oembedData.author}`,
        image: oembedData.thumbnail,
        siteName: "TikTok",
        fromOembed: true,
      };
    }
  }

  // Fallback: Try to scrape HTML
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    const getMeta = (name: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, "i"),
        new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"),
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta("og:title") || 
                  getMeta("twitter:title") || 
                  (titleMatch ? titleMatch[1] : null) ||
                  "Untitled";

    const description = getMeta("og:description") || 
                       getMeta("twitter:description") || 
                       getMeta("description") ||
                       "";

    const image = getMeta("og:image") || 
                  getMeta("twitter:image") ||
                  getMeta("og:image:url") ||
                  getMeta("twitter:image:src");

    const siteName = getMeta("og:site_name") || hostname;

    return {
      title: title.trim(),
      description: description.trim(),
      image,
      siteName,
      fromOembed: false,
    };
  } catch (error) {
    console.error("HTML scraping failed:", error);
    
    // Final fallback
    return {
      title: "Link",
      description: "",
      image: null,
      siteName: hostname,
      fromOembed: false,
    };
  }
}