import React from "react";
import { View, StyleSheet, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GrainyBackground } from "@/components/ui/GrainyBackground";

export function Globe({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.container, style]}>
      <GrainyBackground 
        colors={["#070B14", "#0a0f1c", "#121b2e", "#1B2A4A", "#070B14"]} 
        intensity={0.2}
        style={StyleSheet.absoluteFill} 
      />
      <View style={styles.imageContainer}>
        <Image 
          source={require("@/assets/images/slime.png")} 
          style={styles.image}
        />
      </View>
      <LinearGradient
        colors={["transparent", "rgba(7,11,20,0.4)", "#070B14"]}
        style={styles.shadowGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100, // Makes it look cleaner
  },
  shadowGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },
});
