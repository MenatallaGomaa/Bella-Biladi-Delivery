import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, _password) => {
    const fakeUser = { name: "Demo User", email, token: "FAKEJWT123" };
    setUser(fakeUser);
  };

  const register = async (name, email, _password) => {
    const fakeUser = { name, email, token: "FAKEJWT456" };
    setUser(fakeUser);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
