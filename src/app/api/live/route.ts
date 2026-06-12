import { fetchHomeScoreboard } from "@/lib/espn";

export const dynamic = "force-dynamic";

const CACHE_TTL = 30;

// caches.default is a Cloudflare Workers global; it does not exist in local
// `next dev` (Node), where this returns null and every request is a MISS.
function getEdgeCache(): Cache | null {
  const c = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
  return c?.default ?? null;
}

export async function GET(request: Request) {
  const cache = getEdgeCache();
  const cacheKey = new Request(new URL(request.url).toString());

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const res = new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
      res.headers.set("x-cache", "HIT");
      return res;
    }
  }

  try {
    const data = await fetchHomeScoreboard();
    const body = JSON.stringify(data);
    const baseHeaders: Record<string, string> = {
      "content-type": "application/json",
      "cache-control": `public, max-age=${CACHE_TTL}`,
    };

    // Store a copy in the edge cache; TTL is governed by the cache-control
    // max-age above, so the entry self-expires after 30s.
    if (cache) {
      await cache.put(cacheKey, new Response(body, { headers: baseHeaders }));
    }

    return new Response(body, {
      headers: { ...baseHeaders, "x-cache": "MISS" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch live data from ESPN" }),
      {
        status: 502,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-cache": "MISS",
        },
      },
    );
  }
}
