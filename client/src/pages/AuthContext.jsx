import { createContext, useContext, useEffect, useState } from "react";

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
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
          console.log("🔍 Profile loaded from API:", userData);
          setUser(userData);
        } else {
          // If 404 (user not found) or 401 (unauthorized), clear token
          if (res.status === 404 || res.status === 401) {
            console.log("❌ Profile load failed (user not found or invalid token), removing token");
            localStorage.removeItem("token");
            setUser(null);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const register = async (name, email, password) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registrierung fehlgeschlagen");
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
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

  // Function to refresh user profile (useful after role changes)
  const refreshProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "http://localhost:10000"}/api/profile`, {
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
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
