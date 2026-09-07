function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

const DEFAULT_ORIGIN = "https://ardaltunel.github.io";
const MAX_RESULTS = 8;
const cache = new Map<string, { expires: number; items: unknown[] }>();
const inFlight = new Map<string, Promise<Response>>();
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
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
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

  let requestBody: unknown;
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return jsonResponse({ error: "JSON içerik türü gerekli." }, 415, origin);
    }
    if (Number(request.headers.get("content-length")) > 2048) {
      return jsonResponse({ error: "İstek çok büyük." }, 413, origin);
    }
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return jsonResponse({ error: "İstek çok büyük." }, 413, origin);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    requestBody = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return jsonResponse({ error: "Geçerli bir JSON gövdesi gerekli." }, 400, origin);
  }

  if (!requestBody || typeof requestBody !== "object" || !("query" in requestBody) || typeof requestBody.query !== "string") {
    return jsonResponse({ error: "Arama metni gerekli." }, 400, origin);
  }
  const query = requestBody.query.trim().replace(/\s+/g, " ");
  if (query.length < 2 || query.length > 100) {
    return jsonResponse({ error: "Arama 2 ile 100 karakter arasında olmalı." }, 400, origin);
  }

  const cacheKey = query.toLocaleLowerCase("tr-TR");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return jsonResponse({ items: cached.items }, 200, origin);
  // Deduplicate bursts of identical searches without reusing another origin's CORS.
  const pending = inFlight.get(cacheKey);
  if (pending) {
    const response = await pending;
    return jsonResponse(await response.clone().json(), response.status, origin);
  }
  if (inFlight.size >= 16) return jsonResponse({ error: "Arama yoğun. Biraz sonra tekrar deneyin." }, 429, origin);

  const lookup = async (): Promise<Response> => {
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
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      if (!serviceKey || !supabaseUrl) return jsonResponse({ error: "Arama hizmeti hazır değil." }, 503, origin);
      const budget = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_youtube_search_budget`, {
        method: "POST",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ daily_limit: 80 }),
        signal: AbortSignal.timeout(5000),
      });
      if (!budget.ok) return jsonResponse({ error: "Arama hizmeti hazır değil." }, 503, origin);
      if (await budget.json() !== true) return jsonResponse({ error: "Günlük arama sınırına ulaşıldı. Daha sonra tekrar deneyin." }, 429, origin);
      const youtubeResponse = await fetch(searchUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      const payload = record(await youtubeResponse.json());

      if (!youtubeResponse.ok) {
        const errors = record(payload.error).errors;
        const reason = Array.isArray(errors) ? record(errors[0]).reason : undefined;
        const quotaExceeded = reason === "quotaExceeded" || reason === "dailyLimitExceeded";
        return jsonResponse(
          { error: quotaExceeded ? "YouTube arama kotası doldu." : "YouTube araması tamamlanamadı." },
          quotaExceeded ? 429 : 502,
          origin,
        );
      }

      const items = (Array.isArray(payload?.items) ? payload.items : [])
        .map((value: unknown) => {
          const item = record(value);
          const snippet = record(item.snippet);
          const providerId = String(record(item.id).videoId ?? "");
          if (!/^[a-zA-Z0-9_-]{11}$/.test(providerId)) return null;

          const thumbnails = record(snippet.thumbnails);
          return {
            source: "youtube",
            provider_id: providerId,
            name: String(snippet.title ?? "YouTube videosu"),
            artist: String(snippet.channelTitle ?? "YouTube"),
            album_url: record(thumbnails.high).url ?? record(thumbnails.medium).url ?? record(thumbnails.default).url ?? null,
          };
        })
        .filter(Boolean);

      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(cacheKey, { items, expires: Date.now() + 15 * 60 * 1000 });
      return jsonResponse({ items }, 200, origin);
    } catch (error) {
      console.error("youtube-search failed", error instanceof Error ? error.name : "UnknownError");
      return jsonResponse({ error: "YouTube bağlantısı zaman aşımına uğradı." }, 504, origin);
    }
  };
  const result = lookup();
  inFlight.set(cacheKey, result);
  try { return (await result).clone(); }
  finally { inFlight.delete(cacheKey); }
});
