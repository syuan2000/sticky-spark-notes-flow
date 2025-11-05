import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");
    console.log("Parsing link:", url);

    const metadata = await scrapeMetadata(url);
    console.log("Scraped metadata:", metadata);

    // Skip LLM for Instagram (oEmbed already gives nice summary)
    if (metadata.siteName === "Instagram") {
      return jsonResponse({
        success: true,
        data: {
          url,
          metadata,
          classification: {
            type: "other",
            summary: "Instagram post — open link to view full caption and location.",
            tags: ["instagram", "social"],
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
            content:
              "You are a media classifier. Output ONLY valid JSON. No markdown, no code blocks, just JSON.",
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
// Video oEmbed helpers (YouTube / TikTok)
async function getVideoThumbnail(url: string) {
  const host = new URL(url).hostname.toLowerCase();
  try {
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (r.ok) {
        const j = await r.json();
        return { title: j.title, thumbnail: j.thumbnail_url };
      }
    }
    if (host.includes("tiktok.com")) {
      const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (r.ok) {
        const j = await r.json();
        return { title: j.title, thumbnail: j.thumbnail_url };
      }
    }
  } catch (_) {}
  return { title: null, thumbnail: null };
}

// ──────────────────────────────────────────────────────────────
// Metadata scraper with Instagram oEmbed integration
async function scrapeMetadata(url: string) {
  const host = new URL(url).hostname.toLowerCase();

  // ✅ Instagram oEmbed first
  if (host.includes("instagram.com")) {
    const APP_ID = Deno.env.get("INSTAGRAM_APP_ID");
    const CLIENT_TOKEN = Deno.env.get("INSTAGRAM_CLIENT_TOKEN");
    try {
      if (APP_ID && CLIENT_TOKEN) {
        const oembed = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(
          url,
        )}&access_token=${APP_ID}|${CLIENT_TOKEN}`;
        const res = await fetch(oembed);
        if (res.ok) {
          const data = await res.json();
          return {
            title: data.title || "Instagram post",
            description: data.author_name ? `By ${data.author_name}` : "Instagram content",
            image: data.thumbnail_url,
            siteName: "Instagram",
          };
        }
      }
    } catch (err) {
      console.error("Instagram oEmbed failed:", err);
    }
    // Fallback if oEmbed fails
    return {
      title: "Instagram post",
      description: "Open link to view caption",
      image: null,
      siteName: "Instagram",
    };
  }

  // ✅ Else scrape normally
  const videoData = await getVideoThumbnail(url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const getMeta = (name: string): string | null => {
      const pattern = new RegExp(`<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
      const m = html.match(pattern);
      return m ? m[1] : null;
    };

    const title =
      videoData.title ||
      getMeta("og:title") ||
      getMeta("twitter:title") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
      "Untitled";
    const description =
      getMeta("og:description") || getMeta("twitter:description") || getMeta("description") || "";
    const image = videoData.thumbnail || getMeta("og:image") || getMeta("twitter:image");
    const siteName = getMeta("og:site_name") || host;

    return { title: title.trim(), description: description.trim(), image, siteName };
  } catch (e) {
    console.error("HTML scrape failed:", e);
    return {
      title: videoData.title || "Link",
      description: "",
      image: videoData.thumbnail,
      siteName: host,
    };
  }
}
