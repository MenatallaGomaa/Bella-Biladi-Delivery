import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();

  const storageKey = useMemo(() => {
    return user?.id ? `cart:${user.id}` : "cart:guest";
  }, [user?.id]);

  const [cart, setCart] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  useEffect(() => {
    setIsHydrated(false);
    try {
      const saved = localStorage.getItem(storageKey);
      setCart(saved ? JSON.parse(saved) : []);
    } catch (err) {
      console.warn("⚠️ Fehler beim Lesen des Warenkorbs:", err);
      setCart([]);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey]);

  // migrate legacy cart key once
  useEffect(() => {
    const legacy = localStorage.getItem("cart");
    if (legacy && !localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, legacy);
    }
    localStorage.removeItem("cart");
  }, [storageKey]);

  // Save cart to localStorage whenever it changes and hydration finished
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey, isHydrated]);

  // ✅ Add item (adds one instance)
  function addToCart(item) {
    setCart((prev) => [...prev, item]);
    const baseId = item.baseItemId || item._id || item.id || item.name;
    setLastAdded({ id: baseId, at: Date.now() });
  }

  // ✅ Remove ONE instance by name (removes from the end to preserve order)
  function removeOneFromCart(name) {
    setCart((prev) => {
      // Find the last occurrence to preserve the order of first appearance
      let index = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].name === name) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      }
      return prev;
    });
  }

  // ✅ Remove ALL instances of an item by name
  function removeAllFromCart(name) {
    setCart((prev) => prev.filter((i) => i.name !== name));
  }

  // ✅ Clear entire cart
  function clearCart() {
    setCart([]);
    localStorage.removeItem(storageKey);
    setLastAdded(null);
  }

  useEffect(() => {
    if (!lastAdded) return;
    const timeout = setTimeout(() => setLastAdded(null), 1200);
    return () => clearTimeout(timeout);
  }, [lastAdded]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeOneFromCart,
        removeAllFromCart,
        clearCart,
        setCart,
        lastAdded,
        isCartExpanded,
        setIsCartExpanded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
