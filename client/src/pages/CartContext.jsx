import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  // Load cart from localStorage initially
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ Add item (adds one instance)
  function addToCart(item) {
    setCart((prev) => [...prev, item]);
  }

  // ✅ Remove ONE instance by name
  function removeOneFromCart(name) {
    setCart((prev) => {
      const index = prev.findIndex((i) => i.name === name);
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
    localStorage.removeItem("cart");
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeOneFromCart,
        removeAllFromCart,
        clearCart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
