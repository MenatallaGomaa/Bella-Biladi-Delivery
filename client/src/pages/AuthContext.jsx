import { createContext, useContext, useEffect, useState } from "react";
import { getApiBaseUrl, createApiUrl } from "../utils/apiUrl.js";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    async function loadProfile() {
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn("⚠️ Profile load timeout - clearing loading state");
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        const profileUrl = createApiUrl(getApiBaseUrl(), "/api/profile");
        console.log("🔍 Loading profile from:", profileUrl);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 second abort
        
        const res = await fetch(profileUrl, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const profile = await res.json();
          // Ensure user object includes role with fallback
          const userData = { 
            id: profile._id, 
            name: profile.name, 
            email: profile.email, 
            role: profile.role || "user", 
            emailVerified: profile.emailVerified || false 
          };
          console.log("✅ Profile loaded from API:", userData);
          setUser(userData);
        } else {
          // If 404 (user not found) or 401 (unauthorized), clear token
          if (res.status === 404 || res.status === 401) {
            console.log("❌ Profile load failed (user not found or invalid token), removing token");
            localStorage.removeItem("token");
            setUser(null);
          } else {
            console.warn("⚠️ Profile load failed with status:", res.status);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          console.error("❌ Profile request timed out");
        } else {
          console.error("❌ Profile load error:", err.message);
        }
        // Clear token if there's a network error - user might need to log in again
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Get normalized API base URL
  const apiBase = getApiBaseUrl();
  
  // Debug logging (remove in production if needed)
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    console.log("🔍 API Base URL Debug:", {
      raw: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:4000",
      normalized: apiBase,
      loginUrl: createApiUrl(apiBase, "/api/login")
    });
  }

  // Helper function to safely parse JSON response
  const parseJsonResponse = async (res) => {
    const contentType = res.headers.get("content-type");
    const text = await res.text();
    
    if (!contentType || !contentType.includes("application/json")) {
      if (res.status === 404) {
        throw new Error("API-Endpunkt nicht gefunden. Bitte überprüfe die API-URL.");
      }
      throw new Error(`Ungültige Antwort vom Server (${res.status}). Bitte versuche es erneut.`);
    }
    
    if (!text || text.trim() === "") {
      throw new Error("Leere Antwort vom Server.");
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error("Ungültige JSON-Antwort vom Server.");
    }
  };

  const register = async (name, email, password) => {
    const res = await fetch(createApiUrl(apiBase, "/api/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "Registrierung fehlgeschlagen");
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const loginUrl = createApiUrl(apiBase, "/api/login");
    console.log("🔍 Login URL:", loginUrl);
    
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "Login fehlgeschlagen");
    localStorage.setItem("token", data.token);
    // Ensure user object includes role
    const userData = {
      id: data.user.id || data.user._id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || "user",
      emailVerified: data.user.emailVerified || false,
    };
    console.log("🔍 Login response:", { user: userData, tokenRole: JSON.parse(atob(data.token.split(".")[1])).role });
    setUser(userData);
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  const requestPasswordReset = async (email) => {
    const res = await fetch(createApiUrl(apiBase, "/api/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await parseJsonResponse(res).catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Zurücksetzen konnte nicht gestartet werden");
    }
    // Return the full response data (includes previewUrl and resetUrl in development)
    return data;
  };

  const resetPassword = async (token, password) => {
    const res = await fetch(createApiUrl(apiBase, "/api/reset-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await parseJsonResponse(res).catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Passwort konnte nicht zurückgesetzt werden");
    }
    return true;
  };

  const resetPasswordDirect = async (email, password) => {
    const res = await fetch(createApiUrl(apiBase, "/api/reset-password-direct"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res).catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Passwort konnte nicht zurückgesetzt werden");
    }
    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Bitte melde dich erneut an");
    const res = await fetch(createApiUrl(apiBase, "/api/change-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await parseJsonResponse(res).catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Passwort konnte nicht geändert werden");
    }
    return true;
  };

  // Function to refresh user profile (useful after role changes)
  const refreshProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const profileUrl = createApiUrl(getApiBaseUrl(), "/api/profile");
      const res = await fetch(profileUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        const userData = { 
          id: profile._id, 
          name: profile.name, 
          email: profile.email, 
          role: profile.role || "user", 
          emailVerified: profile.emailVerified || false 
        };
        console.log("🔄 Profile refreshed:", userData);
        setUser(userData);
        return userData;
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      refreshProfile,
      requestPasswordReset,
      resetPassword,
      resetPasswordDirect,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

