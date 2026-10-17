import { defineCollection, reference } from 'astro:content';
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

// ~9 categories, set up by Berend (Peter only picks one per project).
const categories = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/categories' }),
  schema: z.object({
    title: z.string().min(1),
    // Position in the book and in the ribbon menu (1 = first)
    order: z.number().int().positive(),
    // Peter's photo of the category page he made; until then the title is shown
    opener: image.optional(),
    // Optional short text on the opener spread
    intro: z.string().optional(),
    // Accent colour for this category's title strips and notes
    accent: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .optional(),
    // Objects/drawings on or beside the book (book mode only, PLAN.md 2.14).
    // Position and size are in % of the book's width/height; values outside 0–100
    // place the element beside the book on the table.
    elements: z
      .array(
        z.object({
          image,
          x: z.number(),
          y: z.number(),
          width: z.number().positive(),
          rotate: z.number().default(0),
        }),
      )
      .default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    // No category = a loose project, shown right after the intro
    category: reference('categories').optional(),
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

// Fixed spreads: "intro" (front, inside of the front hardcover) and "bio" (back).
// The intro's right page also gets the generated contents (categories, loose projects).
const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: z.object({ left: page, right: page.default([]) }),
});

export const collections = { categories, projects, pages };
