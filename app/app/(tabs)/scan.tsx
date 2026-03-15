import { ViroARSceneNavigator } from '@reactvision/react-viro';
import SlimeARScene from '@/components/ar/SlimeARScene';
import { SlimePatInteraction } from '@/components/ar/SlimePatInteraction';
import { useIsFocused } from "@react-navigation/native";
import { AppState } from "react-native";
import { detectObject } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/user";
import { getUserSlime } from "@/lib/slime";
import { patSlime } from "@/lib/interaction";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
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
  const [viewMode, setViewMode] = useState<'vision' | 'transitioning' | 'ar' | 'checking' | 'naming'>('checking');
  const [hasSlime, setHasSlime] = useState(false);
  const [showArLoading, setShowArLoading] = useState(false);
  const [slimeName, setSlimeName] = useState("");
  const [pendingScanData, setPendingScanData] = useState<{path: string, lat?: number, lng?: number} | null>(null);
  const [slimeId, setSlimeId] = useState<string | null>(null);
  const [showPatInteraction, setShowPatInteraction] = useState(false);
  const [isSlimeSpawned, setIsSlimeSpawned] = useState(false);
  const [arSceneKey, setArSceneKey] = useState(0);

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

  // Check if user already has a slime on mount and when tab is focused
  useEffect(() => {
    if (!isFocused) return;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const slime = await getUserSlime(user.id);
          if (slime) {
            console.log("User has slime, skipping to AR mode");
            setHasSlime(true);
            setSlimeId(slime.id);
            setViewMode('ar');
            // Force AR scene to remount and re-check location
            setArSceneKey(prev => prev + 1);
            return;
          }
        }
        // No slime, show camera for scanning
        setViewMode('vision');
      } catch (e) {
        console.warn("Error checking for slime:", e);
        setViewMode('vision');
      }
    })();
  }, [isFocused]);

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

  // Show loading overlay when entering AR mode
  useEffect(() => {
    if (viewMode === 'ar') {
      setShowArLoading(true);
      // Hide loading screen after data has time to load (1.5 seconds)
      const timer = setTimeout(() => {
        setShowArLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Enable pat interaction only AFTER slime is spawned
  useEffect(() => {
    console.log("isSlimeSpawned changed to:", isSlimeSpawned);
    if (isSlimeSpawned) {
      // Small delay to ensure slime is fully rendered
      const timer = setTimeout(() => {
        console.log("Enabling pat interaction");
        setShowPatInteraction(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log("Disabling pat interaction");
      setShowPatInteraction(false);
    }
  }, [isSlimeSpawned]);

  // Reset spawn state when AR scene remounts
  useEffect(() => {
    if (viewMode === 'ar') {
      setIsSlimeSpawned(false);
    }
  }, [arSceneKey]);

  // Cleanup when leaving AR mode
  useEffect(() => {
    if (viewMode !== 'ar') {
      setShowPatInteraction(false);
      setIsSlimeSpawned(false);
    }
  }, [viewMode]);

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

      // Get current location
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
          console.log("Scan location:", latitude, longitude);
        }
      } catch (locError) {
        console.warn("Failed to get location:", locError);
      }

      // Check if user already has a slime first
      const user = await getCurrentUser();
      const existingSlime = user ? await getUserSlime(user.id) : null;

      if (existingSlime) {
        // User already has slime, detect and go to AR normally
        const result = await detectObject(`file://${photo.path}`, latitude, longitude);

        if (result && result.result !== "Unknown") {
          setDetectedObject(result.result);
          setTimeout(() => {
            setViewMode('transitioning');
            setTimeout(() => setViewMode('ar'), 500);
          }, 2500);
        } else {
          setDetectedObject("Unknown");
        }
      } else {
        // User doesn't have slime yet - detect WITHOUT creating slime first
        // We pass undefined for slime_name to prevent creation
        const result = await detectObject(`file://${photo.path}`, latitude, longitude, "");

        if (result && result.result !== "Unknown") {
          // Valid object detected - show the object type
          setDetectedObject(result.result);

          // Save scan data for later slime creation
          setPendingScanData({ path: photo.path, lat: latitude, lng: longitude });

          // After showing the detection, go to naming screen
          setTimeout(() => {
            setViewMode('naming');
          }, 2500);
        } else {
          // Unknown object - don't proceed
          setDetectedObject("Unknown");
        }
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

  // Handle pat interaction
  const handlePatComplete = useCallback(async () => {
    if (!slimeId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("Patting slime...");

    try {
      const response = await patSlime(slimeId);
      if (response) {
        console.log(`Bond increased! New level: ${response.new_bond_level}`);

        if (response.journey_started && response.destination) {
          console.log(`Journey started to: ${response.destination.name}`);
          // Could show a notification here
        }
      }
    } catch (error) {
      console.warn("Error patting slime:", error);
    }

    // Hide pat interaction briefly
    setShowPatInteraction(false);
    setTimeout(() => setShowPatInteraction(true), 2000);
  }, [slimeId]);

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

  // Show loading while checking for slime
  if (viewMode === 'checking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7DFFA0" />
        <Text style={styles.permissionText}>Checking for slime...</Text>
      </View>
    );
  }

  // Show naming screen for new slime
  if (viewMode === 'naming') {
    const handleNameSubmit = async () => {
      if (!pendingScanData) return;

      setViewMode('transitioning');

      try {
        const finalName = slimeName.trim() || "Unnamed Slime";
        console.log("Sending slime name to backend:", finalName);

        const result = await detectObject(
          `file://${pendingScanData.path}`,
          pendingScanData.lat,
          pendingScanData.lng,
          finalName
        );

        if (result && result.slime) {
          console.log("Slime created. Backend returned:", result.slime);
          setHasSlime(true);
          setSlimeId(result.slime.id);
        }

        setTimeout(() => setViewMode('ar'), 500);
      } catch (error) {
        console.warn("Error creating slime:", error);
        setViewMode('vision');
      }
    };

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.namingContainer}>
          <View style={styles.namingCard}>
            <Text style={styles.namingTitle}>Name Your Slime!</Text>
            <Text style={styles.namingSubtext}>Give your new companion a name</Text>

            <TextInput
              style={styles.nameInput}
              value={slimeName}
              onChangeText={setSlimeName}
              placeholder="Enter slime name..."
              placeholderTextColor="#9CA3AF"
              maxLength={20}
              autoFocus
              onSubmitEditing={handleNameSubmit}
            />

            <Pressable
              style={[styles.namingButton, !slimeName && styles.namingButtonDisabled]}
              onPress={handleNameSubmit}
            >
              <Text style={styles.namingButtonText}>
                {slimeName ? 'Create Slime' : 'Skip'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // 2. If we are transitioning, show a sleek black screen so the camera hardware can reset
  if (viewMode === 'transitioning') {
    return (
      <View style={styles.container} pointerEvents="none">
        <ActivityIndicator size="large" color="#7DFFA0" />
      </View>
    );
  }

  // 1. If we are in AR mode, render ONLY Viro with strict flex: 1 styling
  if (viewMode === 'ar') {
    return (
      <View style={styles.arContainer}>
        <ViroARSceneNavigator
          key={arSceneKey}
          autofocus={true}
          initialScene={{
            scene: SlimeARScene,
            passProps: {
              onSlimeSpawned: () => {
                console.log("onSlimeSpawned callback fired in scan.tsx!");
                setIsSlimeSpawned(true);
              },
            },
          }}
          style={StyleSheet.absoluteFillObject}
          pbrEnabled={true}
          hdrEnabled={true}
          shadowsEnabled={true}
        />

        {/* Pat interaction overlay */}
        {showPatInteraction && !showArLoading && (
          <SlimePatInteraction
            onPatComplete={handlePatComplete}
            isSlimeSpawned={isSlimeSpawned}
          />
        )}

        {/* LOADING SCREEN TO WAIT FOR EVERYTHING TO LOAD OR SPAWN WONT WORK */}
        {showArLoading && (
          <View style={styles.arLoadingOverlay}>
            <View style={styles.arLoadingContent}>
              <ActivityIndicator size="large" color="#7DFFA0" />
              <Text style={styles.arLoadingText}>Preparing AR Experience</Text>
              <Text style={styles.arLoadingSubtext}>Please wait...</Text>
            </View>
          </View>
        )}

        <Pressable
          style={styles.closeArButton}
          onPress={() => {
            setViewMode('transitioning');
            setTimeout(() => setViewMode('vision'), 500);
            setDetectedObject(null);
            setShowPatInteraction(false);
          }}
        >
          <Text style={styles.permissionButtonText}>Close AR</Text>
        </Pressable>
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
  arLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 11, 20, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  arLoadingContent: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "rgba(27, 42, 74, 0.8)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(125, 255, 160, 0.3)",
  },
  arLoadingText: {
    color: "#7DFFA0",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    letterSpacing: 0.5,
  },
  arLoadingSubtext: {
    color: "#E2E8F0",
    fontSize: 16,
    marginTop: 8,
    opacity: 0.8,
  },
  namingContainer: {
    flex: 1,
    backgroundColor: "#070B14",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  namingCard: {
    backgroundColor: "rgba(27, 42, 74, 0.95)",
    borderRadius: 20,
    padding: 30,
    width: "90%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: "rgba(125, 255, 160, 0.3)",
    alignItems: "center",
  },
  namingTitle: {
    color: "#7DFFA0",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  namingSubtext: {
    color: "#E2E8F0",
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.8,
  },
  nameInput: {
    backgroundColor: "rgba(15, 22, 41, 0.8)",
    borderWidth: 2,
    borderColor: "rgba(125, 255, 160, 0.3)",
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: "#E2E8F0",
    width: "100%",
    marginBottom: 20,
    textAlign: "center",
  },
  namingButton: {
    backgroundColor: "#7DFFA0",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  namingButtonDisabled: {
    backgroundColor: "rgba(125, 255, 160, 0.5)",
  },
  namingButtonText: {
    color: "#070B14",
    fontSize: 18,
    fontWeight: "700",
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
