/**
 * expo-location wrapper for geo-tagging patient/assessment records.
 */

import * as Location from "expo-location";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request location permissions.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/**
 * Get current location. Returns null if permission denied or location unavailable.
 */
export async function getCurrentLocation(): Promise<GeoCoordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}
