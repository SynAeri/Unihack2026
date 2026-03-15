import React, { useRef, useState, useEffect } from 'react';
import {
  ViroARScene,
  ViroARPlaneSelector,
  Viro3DObject,
  ViroImage,
  ViroAnimations,
  ViroAmbientLight,
  ViroDirectionalLight,
  ViroNode,
  ViroText,
} from '@reactvision/react-viro';
import * as Location from 'expo-location';
import { getCurrentUser } from '@/lib/user';
import { getUserSlime } from '@/lib/slime';
import { getSlimeCurrentLocation, isNearSlime } from '@/lib/journey';

// Register animations for thought bubbles with ease in/out and movement
ViroAnimations.registerAnimations({
  bubblePop: {
    properties: { scaleX: 0.4, scaleY: 0.4, scaleZ: 0.4 },
    easing: "Bounce",
    duration: 500,
  },
  thoughtFadeIn: {
    properties: {
      scaleX: 0,
      scaleY: 0,
      scaleZ: 0,
      opacity: 0,
    },
    duration: 0,
  },
  thoughtEaseIn: {
    properties: {
      scaleX: 0.4,
      scaleY: 0.4,
      scaleZ: 0.4,
      opacity: 1,
    },
    easing: "EaseOut",
    duration: 400,
  },
  thoughtEaseOut: {
    properties: {
      scaleX: 0,
      scaleY: 0,
      scaleZ: 0,
      opacity: 0,
    },
    easing: "EaseIn",
    duration: 300,
  },
  // Smooth wandering movement
  wanderMove: {
    properties: {},
    easing: "Linear",
    duration: 3000,
  },
});

// All available thought bubble images
const THOUGHT_IMAGES = {
  feelings: [
    require('../../assets/speech/Thought/HappyConfused.png'),
    require('../../assets/speech/Thought/Straightman.png'),
  ],
  desires: [
    require('../../assets/speech/desire/Book.png'),
    require('../../assets/speech/desire/Burger.png'),
    require('../../assets/speech/desire/Fit.png'),
  ],
};

// Flatten all thought images into a single array for random selection
const ALL_THOUGHTS = [...THOUGHT_IMAGES.feelings, ...THOUGHT_IMAGES.desires];

// Helper to get random thought
const getRandomThought = () => {
  const randomIndex = Math.floor(Math.random() * ALL_THOUGHTS.length);
  return ALL_THOUGHTS[randomIndex];
};

// Helper to get random interval between 20-120 seconds
const getRandomInterval = () => {
  return Math.floor(Math.random() * (120000 - 20000 + 1)) + 20000; // 20-120 seconds in ms
};

// LOADING SCREEN TO WAIT FOR EVERYTHING TO LOAD OR SPAWN WONT WORK
// The loading state ensures journey data is fetched before allowing AR placement
export default function SlimeARScene(props: any) {
  const selectorRef = useRef<any>(null);
  const [isSpawned, setIsSpawned] = useState(false);
  const [canSpawn, setCanSpawn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationMessage, setLocationMessage] = useState<string>("");
  const [currentThought, setCurrentThought] = useState<any>(null);
  const [showThought, setShowThought] = useState(false);
  const [thoughtAnimation, setThoughtAnimation] = useState<string>('thoughtFadeIn');
  const [slimePosition, setSlimePosition] = useState<[number, number, number]>([0, 0.05, 0]);

  const thoughtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wanderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnPointRef = useRef<[number, number, number]>([0, 0.05, 0]);

  // Notify parent component of loading state
  useEffect(() => {
    if (props.sceneNavigator && props.sceneNavigator.viroAppProps) {
      props.sceneNavigator.viroAppProps.onLoadingChange?.(isLoading);
    }
  }, [isLoading, props.sceneNavigator]);

  // Check if user is near slime's location
  useEffect(() => {
    const checkLocation = async () => {
      try {
        // Get location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationMessage("Location permission needed to place slime");
          setCanSpawn(false);
          setIsLoading(false);
          return;
        }

        // Get user location
        const userLocation = await Location.getCurrentPositionAsync({});
        const userLat = userLocation.coords.latitude;
        const userLng = userLocation.coords.longitude;

        // Get user's slime
        const user = await getCurrentUser();
        if (!user) {
          setLocationMessage("No user found");
          setCanSpawn(false);
          setIsLoading(false);
          return;
        }

        const slime = await getUserSlime(user.id);
        if (!slime) {
          setLocationMessage("No slime found");
          setCanSpawn(false);
          setIsLoading(false);
          return;
        }

        // Get slime's current location from journey
        const journey = await getSlimeCurrentLocation(slime.id);
        if (!journey) {
          // No journey yet, allow placement (first time)
          console.log("No journey found, allowing placement");
          setCanSpawn(true);
          setLocationMessage("Tap a surface to place your slime!");
          setIsLoading(false);
          return;
        }

        // Check if slime is at birth location (status = idle and place_name = "Birth Location")
        // Allow placement anywhere for newly born slimes
        if (journey.status === 'idle' && journey.place_name === 'Birth Location') {
          console.log("Slime at birth location, allowing placement anywhere");
          setCanSpawn(true);
          setLocationMessage("Tap a surface to place your slime!");
          setIsLoading(false);
          return;
        }

        // Calculate current slime position based on journey progress
        const slimeLat = journey.dest_lat;
        const slimeLng = journey.dest_lng;

        // Check if user is near slime (5km radius - very lenient for testing)
        const nearSlime = isNearSlime(userLat, userLng, slimeLat, slimeLng, 5000);

        if (nearSlime) {
          setCanSpawn(true);
          setLocationMessage("Tap a surface to place your slime!");
        } else {
          setCanSpawn(false);
          const distance = Math.round(
            calculateDistance(userLat, userLng, slimeLat, slimeLng)
          );
          setLocationMessage(`Your slime is ${distance}m away at ${journey.place_name || 'a location'}. Get closer to interact!`);
        }
        setIsLoading(false);
      } catch (error) {
        console.warn("Location check error:", error);
        setLocationMessage("Error checking location");
        setCanSpawn(false);
        setIsLoading(false);
      }
    };

    // Wait a bit for journey data to propagate after slime creation
    const timer = setTimeout(checkLocation, 500);
    return () => clearTimeout(timer);
  }, []);

  // Helper function for distance calculation (same as journey.ts)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Schedule random thought bubbles
  useEffect(() => {
    if (!isSpawned) return;

    const scheduleNextThought = () => {
      const interval = getRandomInterval();
      console.log(`Next thought in ${interval / 1000} seconds`);

      thoughtTimerRef.current = setTimeout(() => {
        // Pick a random thought
        const thought = getRandomThought();
        setCurrentThought(thought);
        setShowThought(true);
        setThoughtAnimation('thoughtEaseIn');

        console.log('Showing thought bubble');

        // Hide thought after 5 seconds with ease out animation
        hideTimerRef.current = setTimeout(() => {
          setThoughtAnimation('thoughtEaseOut');

          // Wait for animation to finish before hiding
          setTimeout(() => {
            setShowThought(false);
            setCurrentThought(null);

            // Schedule next thought
            scheduleNextThought();
          }, 300); // Duration of thoughtEaseOut animation
        }, 5000); // Show thought for 5 seconds
      }, interval);
    };

    // Start the cycle
    scheduleNextThought();

    // Cleanup on unmount
    return () => {
      if (thoughtTimerRef.current) clearTimeout(thoughtTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isSpawned]);

  // Wandering behavior with smoother movement
  useEffect(() => {
    if (!isSpawned) return;

    const WANDER_BOUNDARY = 0.5; // Maximum distance from spawn point (0.5 meters)
    const MOVE_INTERVAL = 4000; // Pick new destination every 4 seconds
    const STEP_INTERVAL = 50; // Update position every 50ms for smooth movement
    const MOVE_DISTANCE = 0.1; // Maximum distance to move per wander

    let targetPosition: [number, number, number] | null = null;
    let stepTimer: NodeJS.Timeout | null = null;

    const pickNewDestination = () => {
      // Generate random direction and distance
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * MOVE_DISTANCE;

      // Calculate potential new position
      let newX = slimePosition[0] + Math.cos(angle) * distance;
      let newZ = slimePosition[2] + Math.sin(angle) * distance;

      // Check if new position is within boundary
      const distanceFromSpawn = Math.sqrt(
        Math.pow(newX - spawnPointRef.current[0], 2) +
        Math.pow(newZ - spawnPointRef.current[2], 2)
      );

      // If outside boundary, move back towards center
      if (distanceFromSpawn > WANDER_BOUNDARY) {
        const angleToCenter = Math.atan2(
          spawnPointRef.current[2] - slimePosition[2],
          spawnPointRef.current[0] - slimePosition[0]
        );
        newX = slimePosition[0] + Math.cos(angleToCenter) * MOVE_DISTANCE * 0.5;
        newZ = slimePosition[2] + Math.sin(angleToCenter) * MOVE_DISTANCE * 0.5;
      }

      targetPosition = [newX, slimePosition[1], newZ];
      // Removed console log to reduce spam
    };

    const smoothStep = () => {
      if (!targetPosition) return;

      setSlimePosition((currentPos) => {
        const dx = targetPosition![0] - currentPos[0];
        const dz = targetPosition![2] - currentPos[2];
        const distance = Math.sqrt(dx * dx + dz * dz);

        // If close enough to target, reach it
        if (distance < 0.001) {
          return currentPos;
        }

        // Move a small step towards target
        const stepSize = 0.002; // Small step for smooth movement
        const newX = currentPos[0] + (dx / distance) * stepSize;
        const newZ = currentPos[2] + (dz / distance) * stepSize;

        return [newX, currentPos[1], newZ];
      });
    };

    // Pick new destination periodically
    pickNewDestination();
    wanderTimerRef.current = setInterval(pickNewDestination, MOVE_INTERVAL);

    // Smooth movement steps
    stepTimer = setInterval(smoothStep, STEP_INTERVAL);

    // Cleanup
    return () => {
      if (wanderTimerRef.current) clearInterval(wanderTimerRef.current);
      if (stepTimer) clearInterval(stepTimer);
    };
  }, [isSpawned, slimePosition]);

  return (
    <ViroARScene
      anchorDetectionTypes={["PlanesHorizontal"]}
      onAnchorFound={(a) => selectorRef.current?.handleAnchorFound(a)}
      onAnchorUpdated={(a) => selectorRef.current?.handleAnchorUpdated(a)}
      onAnchorRemoved={(a) => a && selectorRef.current?.handleAnchorRemoved(a)}
    >
      <ViroAmbientLight color="#ffffff" intensity={1500} />
      <ViroDirectionalLight color="#ffffff" direction={[0, -1, -0.5]} intensity={2000} />

      {/* Location status message */}
      {!isSpawned && locationMessage && (
        <ViroText
          text={locationMessage}
          scale={[0.15, 0.15, 0.15]}
          position={[0, 0, -2]}
          style={{ fontFamily: "Arial", fontSize: 30, color: canSpawn ? "#7DFFA0" : "#FF6B6B" }}
          transformBehaviors={["billboard"]}
        />
      )}

      <ViroARPlaneSelector
        ref={selectorRef}
        alignment="Horizontal"
        onPlaneSelected={(anchor, tapPosition) => {
          if (!canSpawn) {
            console.log("Cannot spawn - user too far from slime");
            return;
          }
          console.log("PLANE TAPPED! Spawning at:", tapPosition || anchor.position);
          setIsSpawned(true);
          setLocationMessage(""); // Clear message once spawned
        }}
      >
        {isSpawned && (
          <ViroNode position={slimePosition}>
            <Viro3DObject
              source={require('../../assets/templates/slime/slime_green.glb')}
              position={[0, 0, 0]}
              scale={[1, 1, 1]}
              type="GLB"
              materials={["slime_color"]}
              animation={{ name: 'Take 001', run: true, loop: true }}
              onLoadEnd={() => console.log("SLIME LOADED")}
              onError={(e) => console.log("GLB ERROR:", e)}
            />

            {/* Thought bubble with randomized content and animations */}
            {showThought && currentThought && (
              <ViroNode
                position={[0, 0.65, 0]}
                transformBehaviors={["billboard"]}
              >
                <ViroImage
                  source={currentThought}
                  scale={[0.4, 0.4, 0.4]}
                  animation={{ name: thoughtAnimation, run: true, loop: false }}
                />
              </ViroNode>
            )}
          </ViroNode>
        )}
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}
