import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  timeout: 30000,
});

// Attach JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kl_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("kl_token");
      localStorage.removeItem("kl_user");
      window.location.href = "/officer/login";
    }
    return Promise.reject(err);
  }
);

export default api;
