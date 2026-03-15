// Enhanced map tab with real-time journey animation and event system
// Integrates all finalTouch systems: journey manager, events, walking time, custom markers

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Pressable, Modal } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { getCurrentUser } from '@/lib/user';
import { getUserSlime } from '@/lib/slime';
import { getSlimeCurrentLocation } from '@/lib/journey';
import { useIsFocused } from '@react-navigation/native';
import {
  JourneyManager,
  createJourneyManager,
  JourneyEvent,
  JourneyStatus,
  getSlimeMarkerColor,
} from '@/lib/finalTouch';

// MapLibre setup
MapLibreGL.setAccessToken(null);

// OpenFreeMap: full roads, labels, buildings — no API key needed
const MAPLIBRE_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export default function MapTab() {
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journeyManager, setJourneyManager] = useState<JourneyManager | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatus | null>(null);
  const [slimeData, setSlimeData] = useState<any>(null);
  const [activeEvent, setActiveEvent] = useState<JourneyEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const managerRef = useRef<JourneyManager | null>(null);

  // Fetch journey data and setup manager
  useEffect(() => {
    if (!isFocused) return;

    const setupJourney = async () => {
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

        setSlimeData(slime);

        const journey = await getSlimeCurrentLocation(slime.id);
        if (!journey) {
          setError('No journey data found');
          setIsLoading(false);
          return;
        }

        // Create journey manager
        const manager = createJourneyManager(
          journey,
          {
            slime_type: slime.slime_type,
            name: slime.name || 'Your Slime',
          },
          {
            onStatusUpdate: (status) => {
              setJourneyStatus(status);
            },
            onEventTriggered: (event) => {
              setActiveEvent(event);
              setShowEventModal(true);
            },
            onJourneyComplete: () => {
              console.log('Journey completed!');
            },
          }
        );

        setJourneyManager(manager);
        managerRef.current = manager;

        // Start journey if status is moving
        if (journey.status !== 'idle') {
          manager.start();
        }

        setIsLoading(false);
      } catch (err) {
        console.warn('Error setting up journey:', err);
        setError('Failed to load journey data');
        setIsLoading(false);
      }
    };

    setupJourney();

    return () => {
      // Cleanup journey manager when leaving tab
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, [isFocused]);

  // Center camera on current position
  useEffect(() => {
    if (journeyStatus && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [
          journeyStatus.currentPosition.lng,
          journeyStatus.currentPosition.lat,
        ],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  }, [journeyStatus?.currentPosition]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7DFFA0" />
        <Text style={styles.loadingText}>Loading journey...</Text>
      </View>
    );
  }

  if (error || !journeyManager || !slimeData) {
    return (
      <View style={styles.container}>
        <Ionicons name="map-outline" size={64} color="#ff6b6b" style={{ opacity: 0.5 }} />
        <Text style={styles.errorText}>{error || 'Failed to load journey'}</Text>
      </View>
    );
  }

  const config = journeyManager.getConfig();
  const details = journeyManager.getJourneyDetails();
  const markerColor = getSlimeMarkerColor(config.slimeType);
  const currentPos = journeyStatus?.currentPosition || config.destination;

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
          centerCoordinate={[currentPos.lng, currentPos.lat]}
          pitch={45}
        />

        {/* Route line */}
        {journeyStatus?.isMoving && (
          <MapLibreGL.ShapeSource
            id="routeSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [config.origin.lng, config.origin.lat],
                  [config.destination.lng, config.destination.lat],
                ],
              },
              properties: {},
            }}
          >
            <MapLibreGL.LineLayer
              id="routeLine"
              style={{
                lineColor: markerColor,
                lineWidth: 4,
                lineOpacity: 0.8,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Current slime position marker */}
        <MapLibreGL.ShapeSource
          id="slimeSource"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [currentPos.lng, currentPos.lat],
            },
            properties: {},
          }}
        >
          <MapLibreGL.CircleLayer
            id="slimeMarker"
            style={{
              circleRadius: 12,
              circleColor: markerColor,
              circleStrokeWidth: 3,
              circleStrokeColor: '#ffffff',
              circleOpacity: 0.9,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Origin marker */}
        {journeyStatus?.isMoving && (
          <MapLibreGL.ShapeSource
            id="originSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [config.origin.lng, config.origin.lat],
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

        {/* Destination marker */}
        <MapLibreGL.ShapeSource
          id="destSource"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [config.destination.lng, config.destination.lat],
            },
            properties: {},
          }}
        >
          <MapLibreGL.CircleLayer
            id="destMarker"
            style={{
              circleRadius: 10,
              circleColor: markerColor,
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
              circleOpacity: 0.5,
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      {/* Journey info overlay */}
      <Animated.View entering={FadeIn} style={styles.overlay}>
        <LinearGradient
          colors={['rgba(7, 11, 20, 0.95)', 'rgba(7, 11, 20, 0.8)']}
          style={styles.infoCard}
        >
          <View style={styles.infoHeader}>
            <Ionicons name="navigate-circle" size={24} color={markerColor} />
            <Text style={styles.slimeName}>{config.slimeName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={markerColor} />
            <Text style={styles.infoLabel}>
              {journeyStatus?.isMoving ? 'Heading to:' : 'Location:'}
            </Text>
            <Text style={styles.infoValue}>{config.placeName}</Text>
          </View>

          {config.placeReason && (
            <Text style={styles.reasonText}>{config.placeReason}</Text>
          )}

          {journeyStatus?.isMoving && (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.round((journeyStatus?.progress || 0) * 100)}%`,
                      backgroundColor: markerColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Progress</Text>
                  <Text style={[styles.statValue, { color: markerColor }]}>
                    {Math.round((journeyStatus?.progress || 0) * 100)}%
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>ETA</Text>
                  <Text style={[styles.statValue, { color: markerColor }]}>
                    {journeyStatus?.formattedETA}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={[styles.statValue, { color: markerColor }]}>
                    {journeyStatus?.formattedTimeRemaining}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: journeyStatus?.isMoving ? markerColor : '#9CA3AF' },
              ]}
            >
              <Ionicons
                name={journeyStatus?.isMoving ? 'walk' : 'pause-circle'}
                size={14}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {journeyStatus?.isMoving ? 'Traveling' : 'Resting'}
              </Text>
            </View>

            <Text style={styles.distanceText}>{details.formattedDistance}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Event modal */}
      <Modal
        visible={showEventModal && activeEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEventModal(false)}>
          <Animated.View entering={SlideInUp} exiting={FadeOut} style={styles.eventCard}>
            <LinearGradient
              colors={['rgba(27, 42, 74, 0.98)', 'rgba(15, 22, 41, 0.98)']}
              style={styles.eventCardGradient}
            >
              <View style={styles.eventIcon}>
                <Ionicons name={activeEvent?.icon as any} size={48} color={markerColor} />
              </View>
              <Text style={styles.eventTitle}>{activeEvent?.title}</Text>
              <Text style={styles.eventDescription}>{activeEvent?.description}</Text>
              {activeEvent?.effect?.pauseSeconds && (
                <Text style={styles.eventEffect}>
                  Pausing for {activeEvent.effect.pauseSeconds}s
                </Text>
              )}
              <Pressable
                style={[styles.eventButton, { backgroundColor: markerColor }]}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.eventButtonText}>Continue</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Recenter button */}
      <Pressable
        style={[styles.recenterButton, { backgroundColor: markerColor }]}
        onPress={() => {
          if (journeyStatus) {
            cameraRef.current?.setCamera({
              centerCoordinate: [
                journeyStatus.currentPosition.lng,
                journeyStatus.currentPosition.lat,
              ],
              zoomLevel: 14,
              pitch: 45,
              animationDuration: 1000,
            });
          }
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
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: '#7DFFA0',
    fontSize: 16,
    fontWeight: '700',
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
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  distanceText: {
    color: 'rgba(255, 255, 255, 0.7)',
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  eventCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventCardGradient: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(125, 255, 160, 0.3)',
    borderRadius: 20,
  },
  eventIcon: {
    marginBottom: 16,
  },
  eventTitle: {
    color: '#7DFFA0',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  eventDescription: {
    color: '#E2E8F0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  eventEffect: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  eventButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  eventButtonText: {
    color: '#070B14',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
