import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

// Spread ids that projects may not use, because the book already has them.
const RESERVED_IDS = new Set(['wie', 'inhoud']);

// Visible projects in book order: newest year first, then by sortDate, then title.
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', (p) => p.data.visible);
  for (const p of all) {
    if (RESERVED_IDS.has(p.id)) throw new Error(`Project id "${p.id}" is reserved`);
  }
  return all.sort(
    (a, b) =>
      b.data.year - a.data.year ||
      (b.data.sortDate ?? '').localeCompare(a.data.sortDate ?? '') ||
      a.data.title.localeCompare(b.data.title, 'nl'),
  );
}

export function groupByYear(projects: Project[]): [number, Project[]][] {
  const groups = new Map<number, Project[]>();
  for (const p of projects) {
    const list = groups.get(p.data.year) ?? [];
    list.push(p);
    groups.set(p.data.year, list);
  }
  return [...groups.entries()];
}
