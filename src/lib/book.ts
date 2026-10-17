import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type Category = CollectionEntry<'categories'>;
export type Page = CollectionEntry<'pages'>;

// One step through the book, in reading order. Every spread has a unique id that is
// also its deep link (#id).
export type Spread =
  | { kind: 'intro'; id: 'begin'; page: Page }
  | { kind: 'opener'; id: string; category: Category; projects: Project[] }
  | { kind: 'project'; id: string; project: Project; category?: Category; last?: boolean }
  | { kind: 'bio'; id: 'wie'; page: Page };

export interface Book {
  spreads: Spread[];
  // Categories that have at least one visible project, in book order
  categories: { category: Category; projects: Project[] }[];
  loose: Project[];
}

// Newest year first, then sortDate, then title.
const byNewest = (a: Project, b: Project) =>
  b.data.year - a.data.year ||
  (b.data.sortDate ?? '').localeCompare(a.data.sortDate ?? '') ||
  a.data.title.localeCompare(b.data.title, 'nl');

async function requirePage(id: 'intro' | 'bio'): Promise<Page> {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`src/content/pages/${id}.json is missing`);
  return page;
}

export async function getBook(): Promise<Book> {
  const projects = (await getCollection('projects', (p) => p.data.visible)).sort(byNewest);
  const allCategories = (await getCollection('categories')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const loose = projects.filter((p) => !p.data.category);
  const categories = allCategories
    .map((category) => ({
      category,
      projects: projects.filter((p) => p.data.category?.id === category.id),
    }))
    // Empty categories would be dead ends in the book; leave them out until they have work.
    .filter((c) => c.projects.length > 0);

  const spreads: Spread[] = [{ kind: 'intro', id: 'begin', page: await requirePage('intro') }];
  for (const project of loose) spreads.push({ kind: 'project', id: project.id, project });
  for (const { category, projects: list } of categories) {
    spreads.push({ kind: 'opener', id: category.id, category, projects: list });
    list.forEach((project, i) =>
      spreads.push({
        kind: 'project',
        id: project.id,
        project,
        category,
        last: i === list.length - 1,
      }),
    );
  }
  spreads.push({ kind: 'bio', id: 'wie', page: await requirePage('bio') });

  // Ids share one namespace (deep links), so a project can't be called like a category.
  const seen = new Set<string>();
  for (const s of spreads) {
    if (seen.has(s.id)) throw new Error(`Duplicate spread id "${s.id}" (project/category/page)`);
    seen.add(s.id);
  }

  return { spreads, categories, loose };
}
