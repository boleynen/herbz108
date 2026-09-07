const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sessionKey = "herbz108-supabase-session";

export const databaseConfigured = Boolean(url && key);

const parse = async (response) => {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || body?.error || "Something went wrong.");
  return body;
};

const headers = (token, extra = {}) => ({ apikey: key, Authorization: `Bearer ${token || key}`, ...extra });

export const getSession = () => {
  try { return JSON.parse(localStorage.getItem(sessionKey)); } catch { return null; }
};

export async function signIn(email, password) {
  const data = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(null, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password })
  }).then(parse);
  const session = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user };
  localStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

export function signOut() { localStorage.removeItem(sessionKey); }

export async function fetchPortfolio() {
  if (!databaseConfigured) return [];
  const items = await fetch(`${url}/rest/v1/portfolio_items?select=*&order=created_at.desc`, { headers: headers() }).then(parse);
  const imageResponse = await fetch(`${url}/rest/v1/portfolio_images?select=*&order=sort_order.asc`, { headers: headers() });
  if (!imageResponse.ok) return items.map(item => ({ ...item, images: [{ image_url: item.image_url, storage_path: item.storage_path, is_cover: true }] }));
  const images = await imageResponse.json();
  return items.map(item => {
    const productImages = images.filter(image => image.item_id === item.id);
    return { ...item, images: productImages.length ? productImages : [{ image_url: item.image_url, storage_path: item.storage_path, is_cover: true }] };
  });
}

export async function fetchOrders() {
  const session = getSession();
  if (!databaseConfigured || !session?.access_token) return [];
  return fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc`, {
    headers: headers(session.access_token)
  }).then(parse);
}

export async function uploadPortfolioImage(file, path) {
  await fetch(`${url}/storage/v1/object/herbz-images/${path}`, {
    method: "POST",
    headers: headers(getSession()?.access_token, { "Content-Type": file.type, "x-upsert": "false" }),
    body: file
  }).then(parse);
  return `${url}/storage/v1/object/public/herbz-images/${path}`;
}

export async function removePortfolioImage(path) {
  const response = await fetch(`${url}/storage/v1/object/herbz-images/${path}`, {
    method: "DELETE",
    headers: headers(getSession()?.access_token)
  });
  if (!response.ok) await parse(response);
}

export async function insertPortfolioItem(record) {
  const response = await fetch(`${url}/rest/v1/portfolio_items`, {
    method: "POST",
    headers: headers(getSession()?.access_token, { "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(record)
  });
  return (await parse(response))[0];
}

export async function insertPortfolioImages(records) {
  const response = await fetch(`${url}/rest/v1/portfolio_images`, {
    method: "POST",
    headers: headers(getSession()?.access_token, { "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(records)
  });
  if (!response.ok) await parse(response);
}

export async function deletePortfolioItem(id) {
  const response = await fetch(`${url}/rest/v1/portfolio_items?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(getSession()?.access_token, { Prefer: "return=minimal" })
  });
  if (!response.ok) await parse(response);
}
