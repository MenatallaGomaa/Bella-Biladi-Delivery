import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ Load registered users from localStorage
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : {};
  });

  // ✅ Keep users saved in localStorage
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // ✅ Load logged-in user on first app load
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ✅ Keep the logged-in user saved in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("loggedInUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("loggedInUser");
    }
  }, [user]);

  const register = async (name, email, password) => {
    console.log("Register triggered:", name, email);

    if (users[email]) {
      throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits.");
    }

    const newUser = { name, email, password, token: "FAKEJWT456" };
    const updatedUsers = { ...users, [email]: newUser };
    setUsers(updatedUsers);
    setUser(newUser);
    localStorage.setItem("loggedInUser", JSON.stringify(newUser)); // ✅ auto-login after register
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
    localStorage.setItem("loggedInUser", JSON.stringify(existingUser)); // ✅ persist login
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("loggedInUser"); // ✅ clear only on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
