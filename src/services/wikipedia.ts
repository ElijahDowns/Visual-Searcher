import type { WikiSummary } from '../types/graph';

const API_BASE = 'https://en.wikipedia.org/w/api.php';
const REST_BASE = 'https://en.wikipedia.org/api/rest_v1';

function buildUrl(params: Record<string, string>): string {
  const url = new URL(API_BASE);
  Object.entries({ ...params, format: 'json', origin: '*' }).forEach(
    ([k, v]) => url.searchParams.set(k, v)
  );
  return url.toString();
}

export async function fetchTopCategories(): Promise<string[]> {
  const url = buildUrl({
    action: 'query',
    list: 'categorymembers',
    cmtitle: 'Category:Main_topic_classifications',
    cmtype: 'subcat',
    cmlimit: '50',
  });
  const res = await fetch(url);
  const data = await res.json();
  return (data.query?.categorymembers ?? []).map(
    (cm: { title: string }) => cm.title
  );
}

export async function fetchCategoryMembers(
  categoryTitle: string
): Promise<Array<{ title: string; ns: number }>> {
  const url = buildUrl({
    action: 'query',
    list: 'categorymembers',
    cmtitle: categoryTitle,
    cmtype: 'subcat|page',
    cmlimit: '20',
  });
  const res = await fetch(url);
  const data = await res.json();
  return data.query?.categorymembers ?? [];
}

export async function searchWikipedia(
  query: string
): Promise<Array<{ title: string; description: string; url: string }>> {
  const url = buildUrl({
    action: 'opensearch',
    search: query,
    limit: '10',
  });
  const res = await fetch(url);
  const data: [string, string[], string[], string[]] = await res.json();
  const [, titles, descriptions, urls] = data;
  return titles.map((title, i) => ({
    title,
    description: descriptions[i] ?? '',
    url: urls[i] ?? '',
  }));
}

export async function fetchPageSummary(title: string): Promise<WikiSummary> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(`${REST_BASE}/page/summary/${encoded}`);
  if (!res.ok) throw new Error(`Failed to fetch summary for "${title}"`);
  return res.json();
}
