import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://show-tracker-31zt.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
