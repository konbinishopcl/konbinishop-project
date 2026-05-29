import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

function buildArticleRedirects() {
  try {
    const raw = readFileSync(
      join(__dirname, "../../apps/api/prisma/data/articles.json"),
      "utf-8",
    );
    const articles: { slug: string }[] = JSON.parse(raw);
    return articles.map((a) => ({
      source: `/${a.slug}`,
      destination: `/noticias/${a.slug}`,
      permanent: true,
    }));
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return buildArticleRedirects();
  },
};

export default nextConfig;
