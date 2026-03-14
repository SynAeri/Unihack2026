import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { Uniwind } from "uniwind";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeIn } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { initializeUser } from "@/lib/user";
import "../global.css";

Uniwind.setTheme("dark");

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize user on app startup
    async function init() {
      try {
        await initializeUser();
      } catch (error) {
        console.warn("Failed to initialize user:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    init();
  }, []);

  // Show loading screen until user is initialized
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7DFFA0" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <StatusBar style="light" />
        <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </Animated.View>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
