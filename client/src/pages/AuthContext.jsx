import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const register = async (name, email, password) => {
    console.log("Register triggered:", name, email);

    if (users[email]) {
      throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits.");
    }

    const newUser = { name, email, password, token: "FAKEJWT456" };
    const updatedUsers = { ...users, [email]: newUser };
    setUsers(updatedUsers);
    setUser(newUser);
  };

  const login = async (email, password) => {
    console.log("Login triggered:", email);

    const existingUser = users[email];
    if (!existingUser) {
      throw new Error("Benutzer nicht gefunden. Bitte registrieren Sie sich.");
    }

    if (existingUser.password !== password) {
      throw new Error("Falsches Passwort. Bitte versuchen Sie es erneut.");
    }

    setUser(existingUser);
  };

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
