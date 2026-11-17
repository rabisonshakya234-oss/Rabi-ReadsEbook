import { API } from './config';

// Server-side GET (used by pages for SEO). Returns null when the API is unreachable or the item is missing.
export async function get(path: string, revalidate = 60) {
  try {
    const r = await fetch(`${API}/api${path}`, { next: { revalidate } } as RequestInit);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export const qs = (obj: Record<string, any>) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? '?' + s : '';
};

// Browser-side call. Pass `form` (FormData) for uploads, `body` for JSON.
export async function api(path: string, { method = 'GET', body, form, token }: { method?: string; body?: any; form?: FormData; token?: string } = {}) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let r;
  try { r = await fetch(`${API}/api${path}`, { method, headers, body: payload }); }
  catch { throw new Error('Cannot reach the server. Is the backend running?'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e: any = new Error(data.message || 'Request failed');
    e.errors = data.errors; e.status = r.status;
    throw e;
  }
  return data;
}

// Downloads go through fetch so the login token can be sent (the backend counts logged-in downloads in the user's history).
export async function downloadBook(id: string, format: string, token?: string) {
  const r = await fetch(`${API}/api/books/${id}/download?format=${format}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.message || 'Download failed');
  }
  const cd = r.headers.get('content-disposition') || '';
  const m = /filename="?([^";]+)"?/i.exec(cd);
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = m ? m[1] : `book.${format}`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
