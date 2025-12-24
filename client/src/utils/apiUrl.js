/**
 * Normalizes API base URL by removing trailing slashes
 * and ensures URLs are properly formatted
 * @param {string} baseUrl - The base URL (can have trailing slash)
 * @returns {string} - Normalized base URL without trailing slash
 */
export function normalizeApiBaseUrl(baseUrl) {
  if (!baseUrl) return "http://localhost:4000";
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Creates a full API URL by combining base URL and endpoint
 * Handles double slashes and ensures proper formatting
 * @param {string} baseUrl - The base URL
 * @param {string} endpoint - The API endpoint (should start with /)
 * @returns {string} - Full API URL
 */
export function createApiUrl(baseUrl, endpoint) {
  const normalizedBase = normalizeApiBaseUrl(baseUrl);
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Remove any double slashes (except after protocol like https://)
  return `${normalizedBase}${normalizedEndpoint}`.replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Gets the API base URL from environment variables
 * @returns {string} - Normalized API base URL
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:4000";
  return normalizeApiBaseUrl(raw);
}

