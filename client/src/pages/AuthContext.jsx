import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // ✅ Get users list safely and fix structure if needed
  const getUsers = () => {
    const raw = localStorage.getItem("users");
    try {
      const parsed = JSON.parse(raw);
      // If it’s a single object, wrap it in an array
      if (parsed && !Array.isArray(parsed)) {
        const fixed = [parsed];
        localStorage.setItem("users", JSON.stringify(fixed));
        return fixed;
      }
      return parsed || [];
    } catch {
      return [];
    }
  };

  // ✅ Register with duplicate email prevention
  const register = async (name, email, password) => {
    const users = getUsers();
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      throw new Error(
        "Diese E-Mail ist bereits registriert. Bitte melde dich an."
      );
    }

    const newUser = { name, email, password };
    const updatedUsers = [...users, newUser];

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  };

  // ✅ Login by checking users list
  const login = async (email, password) => {
    const users = getUsers();
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error("Ungültige E-Mail oder Passwort");
    }

    localStorage.setItem("user", JSON.stringify(foundUser));
    setUser(foundUser);
    return foundUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
