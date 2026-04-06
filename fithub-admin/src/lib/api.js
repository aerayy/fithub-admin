import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://fithub-backend-jd40.onrender.com";

/** Hata mesajlarında gösterilmek üzere kullanılan API adresi */
export function getApiBaseUrl() {
  return baseURL;
}

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("auth_token")
  );
}

export function setToken(token) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

// Request: token ekle
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ——— Coach Messages ———
/** GET /coach/conversations */
export async function getCoachConversations() {
  const res = await api.get("/coach/conversations");
  return res.data.conversations ?? [];
}

/** GET /coach/conversations/:id/messages?limit=50&before= */
export async function getConversationMessages(conversationId, { limit = 50, before } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const res = await api.get(`/coach/conversations/${conversationId}/messages?${params.toString()}`);
  const data = res.data ?? {};
  const messages = Array.isArray(data.messages) ? data.messages : (data.data?.messages ?? []);
  return { messages, has_more: !!data.has_more };
}

/** POST /coach/conversations/:id/messages - returns normalized message */
export async function postConversationMessage(conversationId, body, { message_type = "text", media_url, media_metadata } = {}) {
  const payload = { body, message_type };
  if (media_url) payload.media_url = media_url;
  if (media_metadata) payload.media_metadata = media_metadata;
  const res = await api.post(`/coach/conversations/${conversationId}/messages`, payload);
  const data = res.data;
  const raw = data?.message ?? data;
  return {
    id: raw?.id ?? data?.id,
    sender_type: raw?.sender_type ?? data?.sender_type ?? "coach",
    body: raw?.body ?? data?.body ?? body,
    message_type: raw?.message_type ?? data?.message_type ?? "text",
    media_url: raw?.media_url ?? data?.media_url ?? null,
    media_metadata: raw?.media_metadata ?? data?.media_metadata ?? null,
    created_at: raw?.created_at ?? data?.created_at ?? new Date().toISOString(),
    read_at: raw?.read_at ?? data?.read_at ?? null,
  };
}

/** POST /upload/image (multipart) — returns { url, width, height, size_bytes, format } */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** PATCH /coach/conversations/:id/messages/:messageId/read */
export async function markMessageRead(conversationId, messageId) {
  await api.patch(`/coach/conversations/${conversationId}/messages/${messageId}/read`);
}

/** POST /coach/conversations - yeni konuşma başlat (client_user_id ile) */
export async function createCoachConversation(clientUserId) {
  const res = await api.post("/coach/conversations", { client_user_id: clientUserId });
  return res.data;
}

/** GET /coach/students/active - koçun aktif öğrencileri (Students sayfasıyla aynı endpoint) */
export async function getActiveStudents() {
  const res = await api.get("/coach/students/active");
  const data = res.data ?? {};
  const list = data.students ?? data.data?.students;
  return Array.isArray(list) ? list : [];
}

/** Besin arama - GET /foods/search?q=...&featured_only=...&limit=10 */
export async function searchFoods(query, { featuredOnly = true } = {}) {
  const params = new URLSearchParams({
    q: query,
    limit: "10",
  });
  if (featuredOnly) params.set("featured_only", "true");
  const res = await api.get(`/foods/search?${params.toString()}`);
  return res.data.foods ?? [];
}

export async function searchExercises(query) {
  const res = await api.get(`/exercises/search?q=${encodeURIComponent(query)}&limit=10`);
  return res.data.exercises ?? [];
}

// Response: 401 yakala
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      clearToken();
      // basit çözüm: login’e yönlendir
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
