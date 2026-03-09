import { api, setToken } from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  // backend response: { token, user_id, user_email }
  setToken(data.token);
  return data;
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

    console.log("Signup request to /admin/coaches:", requestBody);
    
    const { data } = await api.post("/admin/coaches", requestBody, {
      headers: {
        "X-Admin-Key": adminKey,
      },
    });
    
    console.log("Signup response:", data);
    
    // Backend'den token dönerse kaydet
    if (data.token || data.access_token) {
      setToken(data.token || data.access_token);
    }
    
    return data;
  } catch (error) {
    console.error("Signup API error:", error);
    console.error("Error details:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
