import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// ─────────────── CONFIG ───────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY"); // for Whisper + LLM (optional)
const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID");
const INSTAGRAM_CLIENT_TOKEN = Deno.env.get("INSTAGRAM_CLIENT_TOKEN");
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");

// ─────────────── SERVER ───────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL required");
    const hostname = new URL(url).hostname.toLowerCase();

    // ── Step 1: scrape metadata ──
    const metadata = await scrapeMetadata(url);

    // ── Step 2: get caption / transcript ──
    let caption = null;
    let transcript = null;

    if (hostname.includes("instagram.com")) {
      caption = await getInstagramCaption(url);
      if (!caption && metadata.description) caption = metadata.description;
    } else if (hostname.includes("tiktok.com")) {
      const tk = await getTikTokData(url);
      caption = tk.caption;
      transcript = await transcribeAudio(tk.playUrl); // optional
      metadata.thumbnail = tk.cover;
    } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      caption = metadata.description || metadata.title;
      // (Optionally you can use yt-dlp CLI for transcript if installed)
    }

    // ── Step 3: classify with local / remote LLM ──
    const classification = await classifyLink({ url, metadata, caption });

    return jsonResponse({
      success: true,
      data: { url, metadata, caption, transcript, classification, parsedAt: new Date().toISOString() },
    });
  } catch (e) {
    console.error(e);
    return jsonResponse({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// ─────────────── HELPERS ───────────────
interface Metadata {
  title: string;
  description: string;
  image?: string;
  thumbnail?: string;
  siteName: string;
}

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// oEmbed / fallback HTML meta
async function scrapeMetadata(url: string): Promise<Metadata> {
  const hostname = new URL(url).hostname.toLowerCase();
  
  let metadata: Metadata;
  console.log(hostname);
  
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    metadata = await getYouTubeOembed(url);
  } else if (hostname.includes("instagram.com")) {
    console.log("starting instagram");
    metadata = await getInstagramOembed(url);
  } else if (hostname.includes("tiktok.com")) {
    metadata = await getTikTokOembed(url);
  } else {
    metadata = { title: "Unknown", description: "", siteName: hostname };
  }
  
  // Fallback: if metadata is poor, try HTML scraping
  if ((!metadata.title || metadata.title === "Instagram" || metadata.title === "TikTok") && !metadata.description) {
    console.log("Primary method failed, trying HTML fallback scraping");
    const htmlMetadata = await scrapeHtmlMetaTags(url);
    if (htmlMetadata.title && htmlMetadata.title !== metadata.title) {
      metadata = { ...metadata, ...htmlMetadata };
    }
  }
  
  return metadata;
}

// Fallback HTML scraper that extracts Open Graph and meta tags
async function scrapeHtmlMetaTags(url: string): Promise<Partial<Metadata>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const metadata: Partial<Metadata> = {};
    
    // Extract Open Graph tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    const ogSiteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
    
    // Extract Twitter Card tags as fallback
    const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i);
    const twitterDescription = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["']/i);
    const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);
    
    // Extract standard meta tags as last resort
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    
    metadata.title = ogTitle?.[1] || twitterTitle?.[1] || titleTag?.[1] || "";
    metadata.description = ogDescription?.[1] || twitterDescription?.[1] || metaDescription?.[1] || "";
    metadata.image = ogImage?.[1] || twitterImage?.[1];
    metadata.siteName = ogSiteName?.[1] || new URL(url).hostname;
    
    console.log("HTML scraping extracted:", metadata);
    return metadata;
  } catch (err) {
    console.error("HTML scraping error:", err);
    return {};
  }
}

// ─────────────── Instagram helpers ───────────────
async function getInstagramOembed(url: string): Promise<Metadata> {
  const graphVersion = "v17.0";
  const normalizedUrl = normalizeInstagramUrl(url);
  const accessToken =
    INSTAGRAM_ACCESS_TOKEN || (INSTAGRAM_APP_ID && INSTAGRAM_CLIENT_TOKEN
      ? `${INSTAGRAM_APP_ID}|${INSTAGRAM_CLIENT_TOKEN}`
      : null);

  try {
    if (!accessToken) throw new Error("Missing Instagram access token");
    console.log("Instagram oEmbed request", { normalizedUrl, hasAccessToken: Boolean(accessToken) });

    const params = new URLSearchParams({
      url: normalizedUrl,
      access_token: accessToken,
      fields: "author_name,title,thumbnail_url,provider_name,provider_url",
      omitscript: "true",
    });

    const endpoint = `https://graph.facebook.com/${graphVersion}/instagram_oembed?${params.toString()}`;
    const res = await fetch(endpoint);

    if (!res.ok) {
      const body = await res.text();
      console.log("Instagram oEmbed response error", { status: res.status, body });
      throw new Error(`Graph oEmbed failed (${res.status})`);
    }

    const d = await res.json();
    console.log("Instagram oEmbed response ok", { title: d.title, author: d.author_name, hasThumb: Boolean(d.thumbnail_url) });
    return {
      title: d.title || "Instagram Post",
      description: `By ${d.author_name}`,
      image: d.thumbnail_url,
      siteName: "Instagram",
    };
  } catch (err) {
    console.log("Instagram oEmbed error", err);
    return { title: "Instagram", description: "", siteName: "Instagram" };
  }
}

async function getInstagramCaption(url: string): Promise<string | null> {
  try {
    const reelUrl = normalizeInstagramUrl(url);
    const apiUrl = `${reelUrl}?__a=1&__d=dis`;
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!res.ok) throw new Error(`IG __a=1 failed: ${res.status}`);
    const data = await res.json();
    const caption =
      data.graphql?.shortcode_media?.edge_media_to_caption?.edges?.[0]?.node?.text ||
      data.items?.[0]?.caption?.text;
    return caption || null;
  } catch (err) {
    console.error("IG caption error:", err);
    return null;
  }
}

function normalizeInstagramUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    // Normalize reel/post/story paths so trailing params don't break oEmbed lookups
    if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
    return parsed.toString();
  } catch {
    return url;
  }
}

// ─────────────── TikTok helpers ───────────────
async function getTikTokOembed(url: string): Promise<Metadata> {
  try {
    const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return {
      title: d.title,
      description: `By ${d.author_name}`,
      image: d.thumbnail_url,
      siteName: "TikTok",
    };
  } catch {
    return { title: "TikTok", description: "", siteName: "TikTok" };
  }
}

// Use TikWM API for caption + direct video/audio URL
async function getTikTokData(url: string): Promise<{ caption?: string; cover?: string; playUrl?: string }> {
  try {
    const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const d = await r.json();
    return {
      caption: d.data?.title || d.data?.desc,
      cover: d.data?.cover,
      playUrl: d.data?.play,
    };
  } catch (err) {
    console.error("TikTok API error:", err);
    return {};
  }
}

// ─────────────── YouTube helpers ───────────────
async function getYouTubeOembed(url: string): Promise<Metadata> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    const d = await r.json();
    return {
      title: d.title,
      description: `By ${d.author_name}`,
      image: d.thumbnail_url,
      siteName: "YouTube",
    };
  } catch {
    return { title: "YouTube", description: "", siteName: "YouTube" };
  }
}

// ─────────────── Audio → Transcript ───────────────
async function transcribeAudio(audioUrl: string | undefined): Promise<string | null> {
  if (!audioUrl || !OPENAI_KEY) return null;
  try {
    const audio = await fetch(audioUrl);
    const blob = await audio.blob();
    const fd = new FormData();
    fd.append("file", new Blob([blob]), "audio.mp3");
    fd.append("model", "whisper-1");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: fd,
    });
    const j = await r.json();
    return j.text || null;
  } catch (err) {
    console.error("Transcription error:", err);
    return null;
  }
}

// ─────────────── LLM classification (vLLM/local/OpenAI) ───────────────
async function classifyLink({ url, metadata, caption }: { url: string; metadata: Metadata; caption: string | null }): Promise<{ type: string; summary: string; tags: string[] }> {
  if (!OPENAI_KEY) return { type: "other", summary: caption || metadata.description, tags: [] };
  try {
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a media classifier. Output ONLY valid JSON: {type:'place|recipe|outfit|tool|other', summary:'<50w>', tags:['tag1','tag2']}",
        },
        {
          role: "user",
          content: `Title:${metadata.title}\nCaption:${caption}\nURL:${url}`,
        },
      ],
      temperature: 0.2,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("Classification error:", err);
    return { type: "other", summary: caption || metadata.description, tags: [] };
  }
}
