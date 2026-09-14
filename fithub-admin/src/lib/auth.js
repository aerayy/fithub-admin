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

export async function signup(email, password, fullName, inviteCode = "") {
  try {
    // Koç kaydı: superadmin anahtarı ARTIK tarayıcıya gömülmüyor. Backend
    // /auth/coach-signup rate limit + (varsa) davet koduyla korunur ve JWT döner.
    const { data } = await api.post("/auth/coach-signup", {
      email,
      password,
      full_name: fullName,
      invite_code: inviteCode ? inviteCode.trim() : null,
    });

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
