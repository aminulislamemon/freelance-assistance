import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const DEFAULT_TAGS = [
  "analytics",
  "conversion",
  "growth",
  "webdev",
  "ai",
  "productivity",
  "marketing",
];

// Map a profile interest id / profession id → dev.to friendly tag
const INTEREST_MAP: Record<string, string[]> = {
  conversion: ["conversion", "analytics", "growth"],
  ai: ["ai", "machinelearning", "chatgpt"],
  growth: ["growth", "marketing", "startup"],
  productivity: ["productivity", "career"],
  marketing: ["marketing", "seo", "growth"],
  webdev: ["webdev", "javascript", "react"],
  design: ["design", "ux", "css"],
  freelance: ["freelance", "career"],
  career: ["career", "productivity"],
  money: ["business", "freelance", "startup"],
  tools: ["tools", "productivity"],
  saas: ["saas", "startup", "business"],
  // professions (fallback)
  designer: ["design", "ux", "css"],
  developer: ["webdev", "javascript", "programming"],
  writer: ["writing", "content"],
  photographer: ["creative", "photography"],
  marketer: ["marketing", "growth", "conversion"],
  consultant: ["business", "career"],
  videographer: ["creative", "video"],
  podcaster: ["podcast"],
  analyst: ["data", "analytics", "ai"],
  ecommerce: ["ecommerce", "shopify", "conversion"],
  coach: ["productivity", "career"],
};

async function fetchTag(tag: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=8&top=14`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as any[];
    return json.map((a) => ({
      id: String(a.id),
      title: a.title ?? "Untitled",
      description: (a.description ?? "").slice(0, 220),
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

const inputSchema = z
  .object({
    interests: z.array(z.string()).optional(),
    profession: z.string().optional(),
  })
  .optional();

export const getTechBlogs = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<{ posts: BlogPost[] }> => {
    const ids = [
      ...(data?.interests ?? []),
      ...(data?.profession ? [data.profession] : []),
    ];
    let tags = Array.from(
      new Set(ids.flatMap((id) => INTEREST_MAP[id] ?? []).filter(Boolean)),
    );
    if (tags.length === 0) tags = DEFAULT_TAGS;
    // Cap tag fan-out
    tags = tags.slice(0, 6);

    const batches = await Promise.all(tags.map(fetchTag));
    const seen = new Set<string>();
    const merged: BlogPost[] = [];
    for (const batch of batches) {
      for (const p of batch) {
        if (!p.url || seen.has(p.url)) continue;
        seen.add(p.url);
        merged.push(p);
      }
    }
    merged.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    return { posts: merged.slice(0, 12) };
  });
