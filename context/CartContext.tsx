import api from "@/constants/api";
import { Product } from "@/constants/types";
import { useAuth } from "@clerk/expo";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import Toast from "react-native-toast-message";

export type CartItem = {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price: number;
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product, size: string) => Promise<void>;
    removeFromCart: (itemId: string, size: string) => Promise<void>;
    updateQuantity: (
        itemId: string,
        quantity: number,
        size: string,
    ) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    itemCount: number;
    loading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { getToken, isSignedIn } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.get("/cart", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success && data.data) {
                const serverCart = data.data;
                const mappedItems: CartItem[] = serverCart.items.map(
                    (item: any) => ({
                        id: item._id,
                        productId: item.product._id,
                        product: item.product,
                        quantity: item.quantity,
                        size: item?.size || "M",
                        price: item.price ?? item.product.price,
                    }),
                );
                setCartItems(mappedItems);
                setCartTotal(serverCart.totalAmount);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (product: Product, size: string) => {
        if (!isSignedIn) {
            return Toast.show({
                type: "error",
                text1: "Please login to add to cart",
            });
        }
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.post(
                "/cart/add",
                {
                    productId: product._id,
                    quantity: 1,
                    size,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
        } catch (error: any) {
            console.error(
                "Failed to add to cart:",
                error?.response?.data || error,
            );
            Toast.show({
                type: "error",
                text1: "Failed to add to cart",
                text2:
                    // surface backend message when available
                    (error as any)?.response?.data?.message ||
                    "Please try again in a moment.",
            });
        } finally {
            // Even if the API returns a 5xx after writing to DB, sync the cart so UI stays correct.
            if (isSignedIn) {
                await fetchCart();
            }
            setLoading(false);
        }
    };

    const removeFromCart = async (productId: string, size: string) => {
        if (!isSignedIn) return;
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.delete(
                `/cart/item/${productId}?size=${size}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (data.success) {
                await fetchCart();
            }
        } catch (error) {
            console.error("Failed to remove from cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (
        productId: string,
        quantity: number,
        size: string = "M",
    ) => {
        if (!isSignedIn) return;
        if (quantity < 1) return;
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.put(
                `/cart/item/${productId}`,
                { quantity, size },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
        } catch (error: any) {
            console.error(
                "Failed to update quantity:",
                error?.response?.data || error,
            );
        } finally {
            if (isSignedIn) {
                await fetchCart();
            }
            setLoading(false);
        }
    };

    const clearCart = async () => {
        if (!isSignedIn) return;
        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.delete(`/cart`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data.success) {
                setCartItems([]);
                setCartTotal(0);
            }
        } catch (error) {
            console.error("Failed to clear cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        if (isSignedIn) {
            fetchCart();
        } else {
            setCartItems([]);
            setCartTotal(0);
        }
    }, [isSignedIn]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                itemCount,
                loading,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
