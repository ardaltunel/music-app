const DEFAULT_ORIGIN = "https://ardaltunel.github.io";
const MAX_RESULTS = 8;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

function configuredOrigins(): Set<string> {
  const extraOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([DEFAULT_ORIGIN, ...extraOrigins]);
}

function isAllowedOrigin(origin: string | null): boolean {
  // Browsers use the literal "null" origin when this static site is opened
  // directly from disk (file://). The function is intentionally public, so
  // accepting that origin only enables CORS; it does not expose the API key.
  if (!origin || origin === "null") return true;
  if (configuredOrigins().has(origin)) return true;

  try {
    const url = new URL(origin);
    return (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      && (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : DEFAULT_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: "Bu kaynaktan gelen isteğe izin verilmiyor." }, 403, origin);
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Yalnızca POST isteği destekleniyor." }, 405, origin);
  }

  const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!youtubeApiKey) {
    return jsonResponse({ error: "YouTube API anahtarı yapılandırılmamış." }, 503, origin);
  }

  let requestBody: { query?: unknown };
  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse({ error: "Geçerli bir JSON gövdesi gerekli." }, 400, origin);
  }

  const query = String(requestBody.query ?? "").trim().replace(/\s+/g, " ");
  if (query.length < 2 || query.length > 100) {
    return jsonResponse({ error: "Arama 2 ile 100 karakter arasında olmalı." }, 400, origin);
  }

  const searchUrl = new URL(YOUTUBE_SEARCH_URL);
  searchUrl.search = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    maxResults: String(MAX_RESULTS),
    videoCategoryId: "10",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    safeSearch: "moderate",
    regionCode: "TR",
    relevanceLanguage: "tr",
    key: youtubeApiKey,
  }).toString();

  try {
    const youtubeResponse = await fetch(searchUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      const reason = payload?.error?.errors?.[0]?.reason;
      const quotaExceeded = reason === "quotaExceeded" || reason === "dailyLimitExceeded";
      return jsonResponse(
        { error: quotaExceeded ? "YouTube arama kotası doldu." : "YouTube araması tamamlanamadı." },
        quotaExceeded ? 429 : 502,
        origin,
      );
    }

    const items = (Array.isArray(payload?.items) ? payload.items : [])
      .map((item: Record<string, any>) => {
        const providerId = String(item?.id?.videoId ?? "");
        if (!/^[a-zA-Z0-9_-]{11}$/.test(providerId)) return null;

        const thumbnails = item?.snippet?.thumbnails ?? {};
        return {
          source: "youtube",
          provider_id: providerId,
          name: String(item?.snippet?.title ?? "YouTube videosu"),
          artist: String(item?.snippet?.channelTitle ?? "YouTube"),
          album_url: thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? null,
        };
      })
      .filter(Boolean);

    return jsonResponse({ items }, 200, origin);
  } catch (error) {
    console.error("youtube-search failed", error);
    return jsonResponse({ error: "YouTube bağlantısı zaman aşımına uğradı." }, 504, origin);
  }
});
