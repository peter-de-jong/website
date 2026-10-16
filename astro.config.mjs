// @ts-check
import { defineConfig } from 'astro/config';

// Static output only: deploybase serves the files from its CDN, no server code.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
});
