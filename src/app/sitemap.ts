import type { MetadataRoute } from "next";
import builds from "../../data/builds.json";
import guides from "../../data/guides.json";
import pokemon from "../../data/pokemon.json";
import { siteUrl } from "./_lib/seo";

export const dynamic = "force-static";

const staticRoutes = [
  "",
  "/pokedex",
  "/builds",
  "/teams",
  "/speed-tiers",
  "/type-chart",
  "/calculator",
  "/guides",
  "/about",
  "/sources"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    ...staticRoutes,
    ...pokemon.map((entry) => `/pokemon/${entry.id}`),
    ...builds.map((entry) => `/builds/${entry.id}`),
    ...guides.map((entry) => `/guides/${entry.id}`)
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
