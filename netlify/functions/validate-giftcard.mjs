export default async function handler(request) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const { code } = await request.json();
    if (typeof code !== "string" || !code.trim()) throw new Error("Enter a giftcard code");
    const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, ""), key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Giftcard validation is not configured");
    const response = await fetch(`${url}/rest/v1/gift_cards?select=code,balance_cents,expires_at,status&code=ilike.${encodeURIComponent(code.trim())}&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) throw new Error("Giftcard validation failed");
    const [card] = await response.json();
    if (!card || card.status !== "active" || card.expires_at < new Date().toISOString().slice(0, 10) || card.balance_cents <= 0) throw new Error("This giftcard is invalid, expired or has no remaining balance");
    return Response.json({ code: card.code, balance_cents: card.balance_cents, expires_at: card.expires_at });
  } catch (error) { return Response.json({ error: error.message || "Giftcard validation failed" }, { status: 400 }); }
}
