import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the context
// --- The magical fix is right here! ---
// We're giving createContext a default value to use as a safety net.
// This prevents the app from crashing if a component asks for the cart
// before the provider is fully ready!
const defaultCartValue = {
    cartItems: [],
    addToCart: () => console.warn('addToCart called outside of CartProvider'),
    removeFromCart: () => console.warn('removeFromCart called outside of CartProvider'),
    updateQuantity: () => console.warn('updateQuantity called outside of CartProvider'),
    cartItemCount: 0
};

const CartContext = createContext(defaultCartValue);


// 2. Create a custom hook for easy access to the context
export const useCart = () => useContext(CartContext);


// 3. Create the Provider component
export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    // --- UPDATED: Load cart from localStorage, checking for old and new keys ---
    useEffect(() => {
        // First, try to load from the old key used by checkout.js
        let storedCart = localStorage.getItem('realmMaidCartForCheckout');
        
        // If the old key is empty or doesn't exist, try the new key
        if (!storedCart) {
            storedCart = localStorage.getItem('realmMaidCart');
        }

        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                if (Array.isArray(parsedCart)) {
                    setCartItems(parsedCart);
                }
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
    }, []);

    // --- Save cart to the NEW localStorage key whenever it changes ---
    useEffect(() => {
        localStorage.setItem('realmMaidCart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                // If item exists, just increase quantity
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // Otherwise, add new item to cart
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            // If quantity is 0 or less, remove the item
            removeFromCart(productId);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: quantity } : item
                )
            );
        }
    };
    
    // Calculate total number of items for the badge
    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // The value that will be available to all children components
    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartItemCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
