import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Only registered users are remembered, not logged-in user
  const [user, setUser] = useState(null);

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : {};
  });

  // ✅ Save registered users but not active login
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // 🔹 Register
  const register = async (name, email, password) => {
    console.log("Register triggered:", name, email);
    const newUser = { name, email, password, token: "FAKEJWT456" };
    const updatedUsers = { ...users, [email]: newUser };
    setUsers(updatedUsers);
    setUser(newUser);
  };

  // 🔹 Login
  const login = async (email, password) => {
    console.log("Login triggered:", email);

    const existingUser = users[email];

    if (!existingUser) {
      throw new Error("Benutzer nicht gefunden. Bitte registrieren Sie sich.");
    }

    if (existingUser.password !== password) {
      throw new Error("Falsches Passwort.");
    }

    setUser(existingUser);
  };

  // 🔹 Logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
