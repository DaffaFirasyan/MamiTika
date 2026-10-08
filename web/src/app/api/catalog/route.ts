import { getPublicCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getPublicCatalog();
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Katalog sedang tidak dapat dimuat. Silakan coba lagi." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
