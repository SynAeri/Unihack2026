// Journey API client for slime location and navigation
// Handles fetching slime current location from journeys table

import { API_BASE_URL } from "./config";

export interface Journey {
  id: string;
  slime_id: string;
  start_lat: number;
  start_lng: number;
  dest_lat: number;
  dest_lng: number;
  progress: number;
  status: string;
  place_name: string;
  place_reason: string;
  created_at: string;
}

/**
 * Get the current/most recent journey for a slime
 * @param slimeId - The slime's ID
 * @returns Journey object or null
 */
export async function getSlimeCurrentLocation(slimeId: string): Promise<Journey | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/journeys/slimes/${slimeId}/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.warn("Failed to fetch slime location:", await response.text());
      return null;
    }

    const journey: Journey = await response.json();
    return journey;
  } catch (error) {
    console.warn("Error fetching slime location:", error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if user is within acceptable range of slime location
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param slimeLat - Slime's latitude
 * @param slimeLng - Slime's longitude
 * @param maxDistanceMeters - Maximum allowed distance (default 5000m / 5km)
 * @returns true if user is close enough
 */
export function isNearSlime(
  userLat: number,
  userLng: number,
  slimeLat: number,
  slimeLng: number,
  maxDistanceMeters: number = 5000
): boolean {
  const distance = calculateDistance(userLat, userLng, slimeLat, slimeLng);
  console.log(`Distance to slime: ${distance.toFixed(2)}m (${(distance / 1000).toFixed(2)}km)`);
  return distance <= maxDistanceMeters;
}
