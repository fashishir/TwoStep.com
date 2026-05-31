import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('twostep-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('twostep-cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, quantity = 1, selectedSize = null, selectedColor = null) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevItems,
        {
          productId: product.id,
          name: product.name,
          price: product.sale_price || product.price,
          image: product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url,
          quantity,
          selectedSize,
          selectedColor,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId, selectedSize, selectedColor) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
          )
      )
    );
  }, []);

  const updateQuantity = useCallback((productId, quantity, selectedSize, selectedColor) => {
    if (quantity <= 0) {
      removeItem(productId, selectedSize, selectedColor);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
