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
