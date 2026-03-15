// Journey animation system for real-time slime movement
// Handles linear interpolation between origin and destination, connects to journey progress updates

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface JourneyAnimationConfig {
  origin: Coordinate;
  destination: Coordinate;
  startTime: Date;
  duration: number; // in seconds
  onPositionUpdate: (position: Coordinate, progress: number) => void;
  onComplete: () => void;
}

/**
 * Calculate current position along journey path using linear interpolation
 * @param origin Starting coordinates
 * @param destination Ending coordinates
 * @param progress Journey progress (0 to 1)
 * @returns Current interpolated position
 */
export function interpolatePosition(
  origin: Coordinate,
  destination: Coordinate,
  progress: number
): Coordinate {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return {
    lat: origin.lat + (destination.lat - origin.lat) * clampedProgress,
    lng: origin.lng + (destination.lng - origin.lng) * clampedProgress,
  };
}

/**
 * Calculate current journey progress based on elapsed time
 * @param startTime Journey start time
 * @param durationSeconds Total journey duration in seconds
 * @returns Progress value between 0 and 1
 */
export function calculateProgress(startTime: Date, durationSeconds: number): number {
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedSeconds = elapsedMs / 1000;
  const progress = elapsedSeconds / durationSeconds;

  return Math.max(0, Math.min(1, progress));
}

/**
 * Calculate current position based on elapsed time
 * @param origin Starting coordinates
 * @param destination Ending coordinates
 * @param startTime Journey start time
 * @param durationSeconds Total journey duration in seconds
 * @returns Current position and progress
 */
export function getCurrentJourneyPosition(
  origin: Coordinate,
  destination: Coordinate,
  startTime: Date,
  durationSeconds: number
): { position: Coordinate; progress: number } {
  const progress = calculateProgress(startTime, durationSeconds);
  const position = interpolatePosition(origin, destination, progress);

  return { position, progress };
}

/**
 * Journey animation controller for real-time updates
 */
export class JourneyAnimator {
  private config: JourneyAnimationConfig;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(config: JourneyAnimationConfig) {
    this.config = config;
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Animation loop - updates position every frame
   */
  private animate = () => {
    if (!this.isRunning) return;

    const { position, progress } = getCurrentJourneyPosition(
      this.config.origin,
      this.config.destination,
      this.config.startTime,
      this.config.duration
    );

    this.config.onPositionUpdate(position, progress);

    if (progress >= 1) {
      this.config.onComplete();
      this.stop();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Update configuration (e.g., when journey changes)
   */
  updateConfig(config: Partial<JourneyAnimationConfig>) {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Calculate estimated time of arrival
 * @param startTime Journey start time
 * @param durationSeconds Total journey duration in seconds
 * @returns ETA as Date object
 */
export function calculateETA(startTime: Date, durationSeconds: number): Date {
  const eta = new Date(startTime.getTime() + durationSeconds * 1000);
  return eta;
}

/**
 * Calculate remaining time in seconds
 * @param startTime Journey start time
 * @param durationSeconds Total journey duration in seconds
 * @returns Remaining seconds (0 if journey complete)
 */
export function getRemainingTime(startTime: Date, durationSeconds: number): number {
  const now = new Date();
  const eta = calculateETA(startTime, durationSeconds);
  const remainingMs = eta.getTime() - now.getTime();
  const remainingSeconds = remainingMs / 1000;

  return Math.max(0, remainingSeconds);
}

/**
 * Format remaining time as human-readable string
 * @param remainingSeconds Remaining time in seconds
 * @returns Formatted string (e.g., "2m 30s", "1h 15m")
 */
export function formatRemainingTime(remainingSeconds: number): string {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
