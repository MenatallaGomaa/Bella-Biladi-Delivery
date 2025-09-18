import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000",
});

export const euro = (cents) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
