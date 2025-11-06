import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:10000";

export const api = axios.create({
  baseURL,
});

export const euro = (cents) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
