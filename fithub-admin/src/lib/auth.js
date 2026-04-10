import { api, setToken } from "./api";
import { translateError } from "./errorHandler";

export async function login(email, password) {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    // backend response: { token, user_id, user_email }
    setToken(data.token);
    return data;
  } catch (error) {
    console.error("Login API error:", error?.response?.status, error?.response?.data);
    // Re-throw with a friendly Turkish message attached so callers can
    // surface it directly without re-implementing translation.
    error.userMessage = translateError(error);
    throw error;
  }
}

export async function signup(email, password, fullName) {
  try {
    // Admin key'i environment variable'dan al, yoksa boş gönder
    const adminKey = import.meta.env.VITE_ADMIN_KEY || "";

    const requestBody = {
      email,
      password,
      full_name: fullName,
      bio: "",
      instagram: "",
      photo_url: "",
      price_per_month: 0,
      rating: 0,
      rating_count: 0,
      specialties: [],
      is_active: true,
    };

    const { data } = await api.post("/admin/coaches", requestBody, {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });

    // Backend'den token dönerse kaydet
    if (data.token || data.access_token) {
      setToken(data.token || data.access_token);
    }

    return data;
  } catch (error) {
    console.error("Signup API error:", error?.response?.status, error?.response?.data);
    error.userMessage = translateError(error);
    throw error;
  }
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
