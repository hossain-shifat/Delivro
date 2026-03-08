import {
    View,
    Text,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Image,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Product } from "@/constants/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { dummyProducts } from "@/assets/assets";
import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const fetchProduct = async () => {
        setProduct(dummyProducts.find((product) => product._id === id) as any);
        setLoading(false);
    };

    useEffect(() => {
        fetchProduct();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Product not found!</Text>
            </SafeAreaView>
        );
    }

    const isLiked = isInWishlist(product._id);

    return (
        <View className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* image carousel */}
                <View>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onScroll={(e) => {
                            const slide = Math.ceil(
                                e.nativeEvent.contentOffset.x /
                                    e.nativeEvent.layoutMeasurement.width,
                            );
                            setActiveImageIndex(slide);
                        }}
                    >
                        {product.images?.map((image, index) => (
                            <Image
                                key={index}
                                source={{ uri: image }}
                                style={{ width: width, height: 450 }}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
            {/* header action */}
            <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center z-10">
                <TouchableOpacity
                    className="w-10 h-10 bg-white/80 rounded-full justify-center items-center"
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={COLORS.primary}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-10 h-10 bg-white/80 rounded-full justify-center items-center"
                    onPress={() => toggleWishlist(product)}
                >
                    <Ionicons
                        name={isLiked ? "heart" : "heart-outline"}
                        size={24}
                        color={isLiked ? COLORS.accent : COLORS.primary}
                    />
                </TouchableOpacity>
            </View>
            {/* Pagination dots */}
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {product.images?.map((_, index) => (
                    <View
                        key={index}
                        className={`h-2 rounded-full ${index === activeImageIndex ? "w-6 bg-primary" : "w-2 bg-gray-300"}`}
                    />
                ))}
            </View>
        </View>
    );
}
