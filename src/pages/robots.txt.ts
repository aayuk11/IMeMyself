import type { APIContext } from 'astro';

export function GET(context: APIContext): Response {
  const sitemap = new URL('/sitemap-index.xml', context.site);
  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
