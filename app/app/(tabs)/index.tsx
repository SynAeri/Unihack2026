import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SHELL_PX } from "@/components/ui/Primary";
import { Globe } from "@/components/home/Globe";
import { AnimatedProgressBar } from "@/components/ui/organisms/progress";

const PET_NAME = "Blobby";
const HEALTH = 0.85;
const HAPPINESS = 0.72;
const BOND_LEVEL = 1;

export default function HomeTab() {
  return (
    <View style={s.root}>
      {/* Globe spans full width — slime is 3D in scene */}
      <Animated.View entering={FadeInUp.delay(100).springify()} style={s.globeSection}>
        <Globe />
      </Animated.View>

      {/* Name + Personality + Bars — padded content below */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.info}>
        <Text style={s.name}>{PET_NAME}</Text>
        <Text style={s.personality}>Curious & Playful</Text>

        {/* Bond level badge — above bars */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={s.bondWrapper}>
          <LinearGradient
            colors={["rgba(125,255,160,0.12)", "rgba(125,255,160,0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bondPill}
          >
            <View style={s.bondInner}>
              <Ionicons name="sparkles" size={14} color="#7DFFA0" style={{ opacity: 0.9 }} />
              <Text style={s.bondLabel}>BOND</Text>
              <Text style={s.bondValue}>{BOND_LEVEL}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Health & Happiness bars */}
        <View style={s.bars}>
          <View style={s.barRow}>
            <Ionicons name="heart" size={16} color="#ff6b6b" />
            <Text style={s.barLabel}>Health</Text>
            <AnimatedProgressBar
              progress={HEALTH}
              height={8}
              width="100%"
              progressColor="#ff6b6b"
              trackColor="rgba(255,255,255,0.1)"
              borderRadius={4}
              containerStyle={s.barTrack}
            />
          </View>
          <View style={s.barRow}>
            <Ionicons name="happy" size={16} color="#7DFFA0" />
            <Text style={s.barLabel}>Happiness</Text>
            <AnimatedProgressBar
              progress={HAPPINESS}
              height={8}
              width="100%"
              progressColor="#7DFFA0"
              trackColor="rgba(255,255,255,0.1)"
              borderRadius={4}
              containerStyle={s.barTrack}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  globeSection: {
    height: 400,
    position: "relative",
  },
  info: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: SHELL_PX,
  },
  name: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },
  personality: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 1,
  },
  bondWrapper: {
    marginTop: 18,
    alignSelf: "center",
  },
  bondPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125,255,160,0.25)",
    overflow: "hidden",
  },
  bondInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bondLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 3,
  },
  bondValue: {
    color: "#7DFFA0",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bars: {
    marginTop: 18,
    width: "100%",
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  barLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    width: 72,
  },
  barTrack: {
    flex: 1,
  },
});
