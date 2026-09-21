export default async function handler(request) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const { id } = await request.json();
    const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!token || !id || !supabaseUrl || !serviceKey) throw new Error("Delete service is not configured");
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } });
    if (!userResponse.ok) return Response.json({ error: "Not authorized" }, { status: 401 });
    const user = await userResponse.json();
    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
    if (!adminResponse.ok || !(await adminResponse.json()).length) return Response.json({ error: "Not authorized" }, { status: 403 });
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
    const imagesResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_images?select=storage_path&item_id=eq.${encodeURIComponent(id)}`, { headers });
    const images = imagesResponse.ok ? await imagesResponse.json() : [];
    const itemResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_items?select=storage_path&id=eq.${encodeURIComponent(id)}`, { headers });
    const items = itemResponse.ok ? await itemResponse.json() : [];
    const paths = [...images.map(image => image.storage_path), ...items.map(item => item.storage_path)].filter(Boolean);
    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/portfolio_items?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { ...headers, Prefer: "return=minimal" } });
    if (!deleteResponse.ok) throw new Error("Could not delete the portfolio item");
    const storageResponse = paths.length ? await fetch(`${supabaseUrl}/storage/v1/object/remove`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ bucketId: "herbz-images", prefixes: paths }) }) : null;
    return Response.json({ deleted: true, storageCleaned: !storageResponse || storageResponse.ok });
  } catch (error) {
    return Response.json({ error: error.message || "Delete failed" }, { status: 400 });
  }
}
