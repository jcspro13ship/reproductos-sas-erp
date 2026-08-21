import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function agregar(producto, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { producto, cantidad }];
    });
  }

  function actualizarCantidad(productoId, cantidad) {
    if (cantidad <= 0) {
      quitar(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i))
    );
  }

  function quitar(productoId) {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  }

  function vaciar() {
    setItems([]);
  }

  const total = items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, agregar, actualizarCantidad, quitar, vaciar, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
