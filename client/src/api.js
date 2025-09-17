import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API || "http://localhost:4000",
});
export const euro = (c = 0) =>
  (c / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
