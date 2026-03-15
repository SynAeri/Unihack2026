// Walking time calculation service for journey duration estimation
// Calculates travel time based on geodesic distance and walking speed

export interface Coordinate {
  lat: number;
  lng: number;
}

// Walking speed constants (meters/second)
const WALKING_SPEEDS = {
  slow: 1.0,      // Leisurely pace
  normal: 1.3,    // Average walking speed
  fast: 1.5,      // Brisk walk
  slime: 1.2,     // Default slime walking speed (slightly slower than human)
};

/**
 * Calculate geodesic distance between two points using Haversine formula
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @returns Distance in meters
 */
export function calculateDistance(from: Coordinate, to: Coordinate): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate journey duration based on distance and walking speed
 * @param distanceMeters Distance in meters
 * @param speedMetersPerSecond Walking speed in m/s (defaults to slime speed)
 * @returns Duration in seconds
 */
export function calculateDuration(
  distanceMeters: number,
  speedMetersPerSecond: number = WALKING_SPEEDS.slime
): number {
  if (distanceMeters <= 0) return 0;
  if (speedMetersPerSecond <= 0) return 0;

  return distanceMeters / speedMetersPerSecond;
}

/**
 * Calculate journey duration from coordinates
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @param speedMetersPerSecond Walking speed (defaults to slime speed)
 * @returns Duration in seconds
 */
export function calculateJourneyDuration(
  from: Coordinate,
  to: Coordinate,
  speedMetersPerSecond: number = WALKING_SPEEDS.slime
): number {
  const distance = calculateDistance(from, to);
  return calculateDuration(distance, speedMetersPerSecond);
}

/**
 * Calculate journey details with distance and duration
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @param speedMetersPerSecond Walking speed (defaults to slime speed)
 * @returns Object with distance and duration
 */
export function calculateJourneyDetails(
  from: Coordinate,
  to: Coordinate,
  speedMetersPerSecond: number = WALKING_SPEEDS.slime
): {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
} {
  const distanceMeters = calculateDistance(from, to);
  const durationSeconds = calculateDuration(distanceMeters, speedMetersPerSecond);

  return {
    distanceMeters,
    durationSeconds,
    distanceKm: distanceMeters / 1000,
    durationMinutes: durationSeconds / 60,
  };
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "1.2 km" or "450 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format duration for display
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "2h 15m", "45m", "30s")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Estimate walking speed based on slime personality
 * Different slime types move at different speeds
 * @param slimeType Type of slime (scholar, glutton, athlete, wanderer)
 * @returns Walking speed in meters/second
 */
export function getSlimeWalkingSpeed(slimeType: string): number {
  const speedMap: Record<string, number> = {
    scholar: WALKING_SPEEDS.slow,      // Slow and thoughtful
    glutton: WALKING_SPEEDS.normal,    // Average speed, stops for food
    athlete: WALKING_SPEEDS.fast,      // Fast and energetic
    wanderer: WALKING_SPEEDS.normal,   // Normal speed, explores
  };

  return speedMap[slimeType.toLowerCase()] || WALKING_SPEEDS.slime;
}

/**
 * Calculate journey with slime-specific speed
 * @param from Starting coordinates
 * @param to Ending coordinates
 * @param slimeType Type of slime
 * @returns Journey details with slime-specific speed
 */
export function calculateSlimeJourney(
  from: Coordinate,
  to: Coordinate,
  slimeType: string
): {
  distanceMeters: number;
  durationSeconds: number;
  speedMetersPerSecond: number;
  formattedDistance: string;
  formattedDuration: string;
} {
  const speed = getSlimeWalkingSpeed(slimeType);
  const details = calculateJourneyDetails(from, to, speed);

  return {
    ...details,
    speedMetersPerSecond: speed,
    formattedDistance: formatDistance(details.distanceMeters),
    formattedDuration: formatDuration(details.durationSeconds),
  };
}

/**
 * Calculate ETA for a journey
 * @param startTime Journey start time
 * @param durationSeconds Duration in seconds
 * @returns ETA as Date object
 */
export function calculateETA(startTime: Date, durationSeconds: number): Date {
  return new Date(startTime.getTime() + durationSeconds * 1000);
}

/**
 * Format ETA for display
 * @param eta ETA as Date object
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export function formatETA(eta: Date): string {
  return eta.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Get walking speed constants for reference
 */
export function getWalkingSpeeds() {
  return { ...WALKING_SPEEDS };
}

/**
 * Adjust duration for terrain difficulty (future enhancement)
 * @param baseDuration Base duration in seconds
 * @param terrain Terrain type (flat, hilly, steep)
 * @returns Adjusted duration
 */
export function adjustForTerrain(
  baseDuration: number,
  terrain: 'flat' | 'hilly' | 'steep' = 'flat'
): number {
  const terrainMultipliers = {
    flat: 1.0,
    hilly: 1.2,
    steep: 1.5,
  };

  return baseDuration * terrainMultipliers[terrain];
}

/**
 * Calculate average speed for completed journey
 * @param distanceMeters Distance traveled in meters
 * @param durationSeconds Time taken in seconds
 * @returns Speed in meters/second
 */
export function calculateAverageSpeed(
  distanceMeters: number,
  durationSeconds: number
): number {
  if (durationSeconds <= 0) return 0;
  return distanceMeters / durationSeconds;
}
