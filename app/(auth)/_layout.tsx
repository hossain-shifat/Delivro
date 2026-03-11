import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import Header from "@/components/Header";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthRoutesLayout() {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded) {
        return null;
    }

    if (isSignedIn) {
        return <Redirect href={"/"} />;
    }

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <Header showBack />
            <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
    );
}
