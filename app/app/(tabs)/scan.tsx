import { ViroARSceneNavigator } from '@reactvision/react-viro';
import SlimeARScene from '@/components/ar/SlimeARScene';
import { useIsFocused } from "@react-navigation/native";
import { AppState } from "react-native";
import { detectObject } from "@/lib/gemini";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

export default function ScanTab() {
  // Use a mode state instead of a boolean to handle the hardware handoff
  const [viewMode, setViewMode] = useState<'vision' | 'transitioning' | 'ar'>('vision');

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);

  const isFocused = useIsFocused();
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setIsForeground(state === "active");
    });
    return () => sub.remove();
  }, []);

  const isCameraActive = isFocused && isForeground && viewMode === 'vision';

  const [detectedObject, setDetectedObject] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const flashOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const labelOpacity = useSharedValue(0);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const onSnap = useCallback(async () => {
    if (isDetecting || !camera.current) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    flashOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0, { duration: 150 })
    );

    buttonScale.value = withSequence(
      withTiming(0.85, { duration: 60 }),
      withTiming(1, { duration: 120 })
    );

    setIsDetecting(true);
    setDetectedObject(null);

    try {
      const photo = await camera.current.takePhoto({
        flash: "off",
        enableShutterSound: false,
      });

      const result = await detectObject(`file://${photo.path}`);

      if (result && result !== "Unknown") {
        setDetectedObject(result);
        
        // --- THE FIX IS HERE ---
        // Wait for the user to read the label, then transition smoothly
        setTimeout(() => {
          setViewMode('transitioning'); // 1. Turn off Vision Camera
          setTimeout(() => {
            setViewMode('ar'); // 2. Turn on Viro AR after 500ms hardware release
          }, 500); 
        }, 2500); // Start transition 2.5 seconds after detection
        
      } else {
        setDetectedObject("Unknown");
      }

      labelOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 400 })
      );
      setTimeout(() => setDetectedObject(null), 3700);

    } catch (e) {
      console.warn("Detection error:", e);
      setDetectedObject("Unknown");
      labelOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 400 })
      );
      setTimeout(() => setDetectedObject(null), 2700);
    } finally {
      setIsDetecting(false);
    }
  }, [flashOpacity, buttonScale, labelOpacity, isDetecting]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) return <View style={styles.container} />;

  // 1. If we are in AR mode, render ONLY Viro with strict flex: 1 styling
  if (viewMode === 'ar') {
    return (
      <View style={styles.arContainer}> 
        <ViroARSceneNavigator
          autofocus={true}
          initialScene={{ scene: SlimeARScene }}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable 
          style={styles.closeArButton} 
          onPress={() => {
            setViewMode('transitioning'); // Turn off AR
            setTimeout(() => setViewMode('vision'), 500); // Back to Vision Camera
            setDetectedObject(null);
          }}
        >
          <Text style={styles.permissionButtonText}>Close AR</Text>
        </Pressable>
      </View>
    );
  }

  // 2. If we are transitioning, show a sleek black screen so the camera hardware can reset
  if (viewMode === 'transitioning') {
    return (
      <View style={styles.container}>
         <ActivityIndicator size="large" color="#7DFFA0" />
      </View>
    );
  }

  // 3. Otherwise, render the normal Vision Camera scanner
  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        photo={true}
      />

      {isDetecting && (
        <View style={styles.labelContainer}>
          <View style={styles.labelPill}>
            <ActivityIndicator size="small" color="#7DFFA0" style={{ marginRight: 10 }} />
            <Text style={[styles.labelText, { fontSize: 14 }]}>Identifying...</Text>
          </View>
        </View>
      )}

      {!isDetecting && detectedObject && (
        <Animated.View style={[styles.labelContainer, labelStyle]}>
          <View style={styles.labelPill}>
            <Text style={styles.labelText}>{detectedObject}</Text>
          </View>
        </Animated.View>
      )}

      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

      <View style={styles.snapContainer}>
        <Animated.View style={buttonStyle}>
          <Pressable onPress={onSnap} style={styles.snapOuter}>
            <View style={styles.snapInner} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  arContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeArButton: {
    position: 'absolute', 
    top: 60, 
    left: 20,
    backgroundColor: "#7DFFA0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 100,
  },
  permissionText: { color: "#E2E8F0", fontSize: 16, textAlign: "center", paddingHorizontal: 40, marginBottom: 20 },
  permissionButton: { backgroundColor: "#7DFFA0", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionButtonText: { color: "#070B14", fontSize: 16, fontWeight: "600" },
  labelContainer: { position: "absolute", top: 80, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  labelPill: { backgroundColor: "rgba(15, 22, 41, 0.75)", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(125, 255, 160, 0.3)", flexDirection: "row", alignItems: "center" },
  labelText: { color: "#7DFFA0", fontSize: 18, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase" },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff" },
  snapContainer: { position: "absolute", bottom: 100, left: 0, right: 0, alignItems: "center" },
  snapOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: "rgba(255, 255, 255, 0.4)", backgroundColor: "rgba(255, 255, 255, 0.1)", justifyContent: "center", alignItems: "center" },
  snapInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
});
