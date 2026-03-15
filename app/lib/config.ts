// App configuration
// Central place for API URLs and other environment-specific settings

/**
 * Backend API Base URL
 * Points to the FastAPI backend via ngrok tunnel
 */
export const API_BASE_URL = 'https://unflattering-elinor-distinctively.ngrok-free.dev';

/**
 * API Endpoints
 * Organized by feature area for easy reference
 */
export const API_ENDPOINTS = {
  // Health & Status
  health: `${API_BASE_URL}/health`,
  root: `${API_BASE_URL}/`,

  // Auth
  login: `${API_BASE_URL}/auth/login`,

  // Slimes
  interpretImage: `${API_BASE_URL}/slimes/interpret-image`,
  getUserSlime: (userId: string) => `${API_BASE_URL}/slimes/users/${userId}/slime`,
  setSlimeState: (slimeId: string) => `${API_BASE_URL}/slimes/${slimeId}/state`,

  // Events
  getSlimeEvents: (slimeId: string) => `${API_BASE_URL}/events/slimes/${slimeId}/events`,
  createEvent: `${API_BASE_URL}/events/create`,

  // Interactions
  feedSlime: (slimeId: string) => `${API_BASE_URL}/interaction/slimes/${slimeId}/feed`,
  patSlime: (slimeId: string) => `${API_BASE_URL}/interaction/slimes/${slimeId}/pat`,
  fusePersonality: (slimeId: string) => `${API_BASE_URL}/interaction/slimes/${slimeId}/fuse-personality`,

  // Journeys
  startJourney: `${API_BASE_URL}/journeys/start`,
  getJourney: (journeyId: string) => `${API_BASE_URL}/journeys/${journeyId}`,
  updateProgress: (journeyId: string) => `${API_BASE_URL}/journeys/${journeyId}/progress`,
  getCurrentJourney: (slimeId: string) => `${API_BASE_URL}/journeys/slimes/${slimeId}/current`,
  forceStartJourney: (slimeId: string) => `${API_BASE_URL}/journeys/slimes/${slimeId}/force-start`,

  // Debug
  seedSlime: `${API_BASE_URL}/debug/seed-slime`,
  debugSetState: `${API_BASE_URL}/debug/set-state`,
  createTestEvent: `${API_BASE_URL}/debug/create-event`,

  // Test Endpoints
  testHealth: `${API_BASE_URL}/test/health/full`,
  testSummary: `${API_BASE_URL}/test/summary`,
};

/**
 * Request timeout
 */
export const REQUEST_TIMEOUT = 30000; 

/**
 * Helper function to build query strings
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  return query.toString();
};
