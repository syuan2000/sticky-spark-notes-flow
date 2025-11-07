import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// ─────────────── CONFIG ───────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY"); // for Whisper + LLM (optional)

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
    return jsonResponse({ success: false, error: e.message }, 500);
  }
});

// ─────────────── HELPERS ───────────────
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// oEmbed / fallback HTML meta
async function scrapeMetadata(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be"))
    return await getYouTubeOembed(url);
  if (hostname.includes("instagram.com"))
    return await getInstagramOembed(url);
  if (hostname.includes("tiktok.com"))
    return await getTikTokOembed(url);
  return { title: "Unknown", description: "", siteName: hostname };
}

// ─────────────── Instagram helpers ───────────────
async function getInstagramOembed(url) {
  try {
    const res = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("oEmbed fail");
    const d = await res.json();
    return {
      title: d.title || "Instagram Post",
      description: `By ${d.author_name}`,
      image: d.thumbnail_url,
      siteName: "Instagram",
    };
  } catch {
    return { title: "Instagram", description: "", siteName: "Instagram" };
  }
}

async function getInstagramCaption(url) {
  try {
    const reelUrl = url.includes("?") ? url.split("?")[0] : url;
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

// ─────────────── TikTok helpers ───────────────
async function getTikTokOembed(url) {
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
async function getTikTokData(url) {
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
async function getYouTubeOembed(url) {
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
async function transcribeAudio(audioUrl) {
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
async function classifyLink({ url, metadata, caption }) {
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
