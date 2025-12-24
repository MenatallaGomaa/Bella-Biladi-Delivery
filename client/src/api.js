import axios from "axios";

// Normalize API base URL - remove trailing slash to avoid double slashes
const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/+$/, "");

export const api = axios.create({
  baseURL,
});

export const euro = (cents) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
