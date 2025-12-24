import { api, setToken } from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  // backend response: { token, user_id, user_email }
  setToken(data.token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
