import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export const api = axios.create({
  baseURL,
});

export const euro = (cents) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
