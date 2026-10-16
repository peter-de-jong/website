import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Single source of truth for content. /beheer writes JSON files that must match this.
// Keys are English (code convention); Peter only ever sees the Dutch labels in /beheer.

// A photo or drawing that already exists as WebP variants: `${src}-${w}.webp`.
const image = z.object({
  src: z.string().regex(/^\/media\/[a-z0-9-]+\/[a-f0-9]{8}$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  alt: z.string().min(1, 'Elke foto heeft een korte beschrijving nodig'),
});

const block = z.discriminatedUnion('type', [
  // Tekst: simple Markdown (bold, italic, links)
  z.object({ type: z.literal('text'), text: z.string().min(1) }),
  // Foto: one photo glued on the page
  z.object({ type: z.literal('photo'), image, caption: z.string().optional() }),
  // Foto's: 2–12 photos, arranged automatically
  z.object({
    type: z.literal('photos'),
    images: z.array(image).min(2).max(12),
  }),
  // Tekening: illustration blended into the paper, no photo frame
  z.object({ type: z.literal('drawing'), image }),
]);

const page = z.array(block);

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    year: z.number().int().min(1900).max(2100),
    medium: z.string().optional(),
    dimensions: z.string().optional(),
    visible: z.boolean().default(true),
    // Optional tie-breaker for ordering within a year (ISO date)
    sortDate: z.iso.date().optional(),
    left: page,
    right: page,
  }),
});

// The "wie?" spread: left = inside of the front hardcover, right = first page.
const about = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/about' }),
  schema: z.object({ left: page, right: page }),
});

export const collections = { projects, about };
