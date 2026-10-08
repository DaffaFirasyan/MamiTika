import { getPublicGallery } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ items: await getPublicGallery() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Galeri sedang tidak dapat dimuat. Silakan coba lagi." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
