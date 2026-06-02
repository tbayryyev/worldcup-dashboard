import { fetchSummary } from "@/lib/espn";

export const dynamic = "force-dynamic";

const CACHE_TTL = 30;

// caches.default is a Cloudflare Workers global; absent in local `next dev`.
function getEdgeCache(): Cache | null {
  const c = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
  return c?.default ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
    const detail = await fetchSummary(id);
    if (!detail) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
    }

    const body = JSON.stringify(detail);
    const baseHeaders: Record<string, string> = {
      "content-type": "application/json",
      "cache-control": `public, max-age=${CACHE_TTL}`,
    };

    if (cache) {
      await cache.put(cacheKey, new Response(body, { headers: baseHeaders }));
    }

    return new Response(body, {
      headers: { ...baseHeaders, "x-cache": "MISS" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch match detail from ESPN" }),
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
