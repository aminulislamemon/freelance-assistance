import { createServerFn } from "@tanstack/react-start";

export type BlogPost = {
  id: string;
  title: string;
  description: string;
  url: string;
  cover: string | null;
  author: string;
  source: string;
  tags: string[];
  publishedAt: string;
  readingMinutes: number;
};

const TAGS = [
  "analytics",
  "conversion",
  "growth",
  "webdev",
  "ai",
  "productivity",
  "marketing",
];

async function fetchTag(tag: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=8&top=7`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as any[];
    return json.map((a) => ({
      id: String(a.id),
      title: a.title ?? "Untitled",
      description: a.description ?? "",
      url: a.url ?? a.canonical_url ?? "#",
      cover: a.cover_image ?? a.social_image ?? null,
      author: a.user?.name ?? "Unknown",
      source: "dev.to",
      tags: Array.isArray(a.tag_list) ? a.tag_list.slice(0, 3) : [],
      publishedAt: a.published_at ?? a.published_timestamp ?? new Date().toISOString(),
      readingMinutes: Number(a.reading_time_minutes ?? 4),
    }));
  } catch {
    return [];
  }
}

export const getTechBlogs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ posts: BlogPost[] }> => {
    const batches = await Promise.all(TAGS.map(fetchTag));
    const seen = new Set<string>();
    const merged: BlogPost[] = [];
    for (const batch of batches) {
      for (const p of batch) {
        if (seen.has(p.url)) continue;
        seen.add(p.url);
        merged.push(p);
      }
    }
    merged.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    return { posts: merged.slice(0, 12) };
  },
);