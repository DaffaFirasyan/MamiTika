import type { MetadataRoute } from "next";
import { getPublicCatalog } from "@/lib/catalog";
import { canonicalUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: canonicalUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: canonicalUrl("/menu"), changeFrequency: "weekly", priority: 0.9 },
    { url: canonicalUrl("/snack-box"), changeFrequency: "monthly", priority: 0.8 },
    { url: canonicalUrl("/galeri"), changeFrequency: "monthly", priority: 0.7 },
    { url: canonicalUrl("/kontak"), changeFrequency: "monthly", priority: 0.6 },
  ];
  const { products } = await getPublicCatalog();
  return pages.concat(products.map((product) => ({
    url: canonicalUrl(`/menu/${encodeURIComponent(product.slug)}`),
    ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
    changeFrequency: "monthly",
    priority: 0.7,
  })));
}
