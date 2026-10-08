// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './site.config.ts';

// Netlify sets URL to the site's primary URL at build time.
const siteUrl = process.env.URL || site.url;

export default defineConfig({
  site: siteUrl,
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.endsWith('/404/') }),
  ],
  markdown: {
    // Monochrome code blocks: token colours map to theme variables in global.css.
    shikiConfig: { theme: 'css-variables' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
