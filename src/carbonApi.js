import { getProductImage } from './assetMap';
const API_URL = 'https://istedkhoslreungtcdfe.supabase.co/functions/v1/carbon-api';

async function call(action, payload = {}, token = null) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
  return data;
}

export const loadStoreData = () => call('store-data');
export const loginAdmin = (email, password) => call('login', { email, password });
export const signupAdmin = (email, password) => call('signup', { email, password });
export const loadAdminData = (token) => call('admin-data', {}, token);
export const saveProduct = (token, product) => call('save-product', { product }, token);
export const deleteProduct = (token, id) => call('delete-product', { id }, token);

export function mapProduct(row) {
  const price = Number(row.price_iqd || 0);
  const old = row.old_price_iqd == null ? null : Number(row.old_price_iqd);
  const discount = old && old > price ? Math.round((1 - price / old) * 100) : 0;
  const category = row.categories?.name_ar || row.categories?.name_en || '';
  const brand = row.brands?.name_ar || row.brands?.name_en || '';
  const kind = category.includes('كرياتين') ? 'creatine'
    : category.includes('فيتامين') ? 'vitamins'
    : category.includes('وزن') ? 'mass'
    : category.includes('تمرين') || category.toLowerCase().includes('pre') ? 'pre'
    : category.includes('إكسسوار') ? 'gear'
    : 'whey';

  return {
    id: row.id,
    name: row.name_en || row.name_ar,
    ar: row.name_ar,
    brand,
    category,
    price,
    old,
    rating: Number(row.rating_average || 0),
    reviews: Number(row.reviews_count || 0),
    image: kind,
    imageUrl: getProductImage(row.slug, row.main_image_url || null),
    badge: discount ? `-${discount}%` : row.is_new ? 'جديد' : row.on_offer ? 'عرض' : '',
    detail: row.short_description_ar || '',
    stock: Number(row.stock || 0),
  };
}

export function loadStoredAdminSession() {
  try { return JSON.parse(localStorage.getItem('carbon_admin_session') || 'null'); }
  catch { return null; }
}

export function storeAdminSession(session) {
  localStorage.setItem('carbon_admin_session', JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem('carbon_admin_session');
}
