// Map tab for visualizing slime journey and location
// Connects to journeys table via backend API, uses MapLibre GL for 3D map rendering

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Pressable, Animated } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '@/lib/user';
import { getUserSlime } from '@/lib/slime';
import { getSlimeCurrentLocation } from '@/lib/journey';
import { useIsFocused } from '@react-navigation/native';

// MapLibre setup
MapLibreGL.setAccessToken(null);

// OpenFreeMap: full roads, labels, buildings — no API key needed
const MAPLIBRE_STYLE = 'https://tiles.openfreemap.org/styles/positron';

interface JourneyState {
  slimeId: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  status: 'idle' | 'moving';
  placeName: string;
  placeReason: string;
  progress: number;
}

export default function MapTab() {
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [slimeName, setSlimeName] = useState<string>('Your Slime');
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for slime marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Fetch journey data when tab is focused
  useEffect(() => {
    if (!isFocused) return;

    const fetchJourneyData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const user = await getCurrentUser();
        if (!user) {
          setError('No user found');
          setIsLoading(false);
          return;
        }

        const slime = await getUserSlime(user.id);
        if (!slime) {
          setError('No slime found. Scan an object to create your slime!');
          setIsLoading(false);
          return;
        }

        setSlimeName(slime.name || 'Your Slime');

        const journey = await getSlimeCurrentLocation(slime.id);
        if (!journey) {
          setError('No journey data found');
          setIsLoading(false);
          return;
        }

        // Build journey state
        setJourneyState({
          slimeId: slime.id,
          origin: {
            lat: journey.start_lat,
            lng: journey.start_lng,
          },
          destination: {
            lat: journey.dest_lat,
            lng: journey.dest_lng,
          },
          status: journey.status === 'idle' ? 'idle' : 'moving',
          placeName: journey.place_name || 'Unknown Location',
          placeReason: journey.place_reason || '',
          progress: journey.progress || 0,
        });

        setIsLoading(false);
      } catch (err) {
        console.warn('Error fetching journey data:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      }
    };

    fetchJourneyData();
  }, [isFocused]);

  // Center camera on slime location
  useEffect(() => {
    if (journeyState && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [journeyState.destination.lng, journeyState.destination.lat],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  }, [journeyState]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7DFFA0" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Ionicons name="map-outline" size={64} color="#ff6b6b" style={{ opacity: 0.5 }} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!journeyState) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No journey data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={MAPLIBRE_STYLE}
        compassEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={[journeyState.destination.lng, journeyState.destination.lat]}
          pitch={45}
        />

        {/* Route line from origin to destination */}
        {journeyState.status === 'moving' && (
          <MapLibreGL.ShapeSource
            id="routeSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [journeyState.origin.lng, journeyState.origin.lat],
                  [journeyState.destination.lng, journeyState.destination.lat],
                ],
              },
              properties: {},
            }}
          >
            <MapLibreGL.LineLayer
              id="routeLine"
              style={{
                lineColor: '#7DFFA0',
                lineWidth: 4,
                lineOpacity: 0.8,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Slime current location marker */}
        <MapLibreGL.ShapeSource
          id="slimeSource"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [journeyState.destination.lng, journeyState.destination.lat],
            },
            properties: {},
          }}
        >
          <MapLibreGL.CircleLayer
            id="slimeMarker"
            style={{
              circleRadius: 12,
              circleColor: '#7DFFA0',
              circleStrokeWidth: 3,
              circleStrokeColor: '#ffffff',
              circleOpacity: 0.9,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Origin marker (if moving) */}
        {journeyState.status === 'moving' && (
          <MapLibreGL.ShapeSource
            id="originSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [journeyState.origin.lng, journeyState.origin.lat],
              },
              properties: {},
            }}
          >
            <MapLibreGL.CircleLayer
              id="originMarker"
              style={{
                circleRadius: 8,
                circleColor: '#9CA3AF',
                circleStrokeWidth: 2,
                circleStrokeColor: '#ffffff',
                circleOpacity: 0.6,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {/* Journey info overlay */}
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(7, 11, 20, 0.95)', 'rgba(7, 11, 20, 0.8)']}
          style={styles.infoCard}
        >
          <View style={styles.infoHeader}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="navigate-circle" size={24} color="#7DFFA0" />
            </Animated.View>
            <Text style={styles.slimeName}>{slimeName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#7DFFA0" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{journeyState.placeName}</Text>
          </View>

          {journeyState.placeReason && (
            <Text style={styles.reasonText}>{journeyState.placeReason}</Text>
          )}

          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge,
              journeyState.status === 'moving' ? styles.statusMoving : styles.statusIdle
            ]}>
              <Ionicons
                name={journeyState.status === 'moving' ? 'walk' : 'pause-circle'}
                size={14}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {journeyState.status === 'moving' ? 'Traveling' : 'Resting'}
              </Text>
            </View>

            {journeyState.status === 'moving' && (
              <Text style={styles.progressText}>
                {Math.round(journeyState.progress * 100)}% complete
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Recenter button */}
      <Pressable
        style={styles.recenterButton}
        onPress={() => {
          cameraRef.current?.setCamera({
            centerCoordinate: [journeyState.destination.lng, journeyState.destination.lat],
            zoomLevel: 14,
            pitch: 45,
            animationDuration: 1000,
          });
        }}
      >
        <Ionicons name="locate" size={24} color="#070B14" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  container: {
    flex: 1,
    backgroundColor: '#070B14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(125, 255, 160, 0.3)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  slimeName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  infoValue: {
    color: '#7DFFA0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  reasonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusMoving: {
    backgroundColor: '#7DFFA0',
  },
  statusIdle: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressText: {
    color: '#7DFFA0',
    fontSize: 13,
    fontWeight: '600',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7DFFA0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
