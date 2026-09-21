const baseUrl = () => process.env.PRODIGI_ENVIRONMENT === "live" ? "https://api.prodigi.com" : "https://api.sandbox.prodigi.com";

export default async function handler(request) {
  if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const sku = new URL(request.url).searchParams.get("sku");
  if (!sku || !process.env.PRODIGI_API_KEY) return Response.json({ variants: [] });
  const response = await fetch(`${baseUrl()}/v4.0/products/${encodeURIComponent(sku)}`, { headers: { "X-API-Key": process.env.PRODIGI_API_KEY } });
  if (!response.ok) return Response.json({ error: "Could not load product availability" }, { status: 502 });
  const product = await response.json();
  return Response.json({ variants: product.variants || [] }, { headers: { "Cache-Control": "public, max-age=300" } });
}
