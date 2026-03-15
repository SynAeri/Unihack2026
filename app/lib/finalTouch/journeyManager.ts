// Integrated journey manager combining animation, events, and time calculation
// Central orchestrator for real-time slime journey visualization and state management

import { JourneyAnimator, Coordinate, interpolatePosition, calculateProgress } from './journeyAnimation';
import { JourneyEventManager, JourneyEvent, generateRandomEvent } from './journeyEvents';
import { calculateSlimeJourney, calculateETA, formatETA, formatDuration } from './walkingTime';

export interface JourneyConfig {
  journeyId: string;
  slimeId: string;
  slimeType: string;
  slimeName: string;
  origin: Coordinate;
  destination: Coordinate;
  startTime: Date;
  placeName: string;
  placeReason: string;
}

export interface JourneyStatus {
  journeyId: string;
  currentPosition: Coordinate;
  progress: number;
  isMoving: boolean;
  distanceRemaining: number;
  timeRemaining: number;
  eta: Date;
  formattedETA: string;
  formattedTimeRemaining: string;
  activeEvent: JourneyEvent | null;
  upcomingEvents: JourneyEvent[];
  triggeredEvents: JourneyEvent[];
}

export interface JourneyCallbacks {
  onPositionUpdate?: (position: Coordinate, progress: number) => void;
  onEventTriggered?: (event: JourneyEvent) => void;
  onJourneyComplete?: () => void;
  onStatusUpdate?: (status: JourneyStatus) => void;
}

/**
 * Integrated journey manager class
 * Combines animation, events, and time calculation into a single system
 */
export class JourneyManager {
  private config: JourneyConfig;
  private callbacks: JourneyCallbacks;
  private animator: JourneyAnimator | null = null;
  private eventManager: JourneyEventManager;
  private isActive: boolean = false;
  private activeEvent: JourneyEvent | null = null;
  private eventPauseEndTime: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  // Journey details
  private journeyDetails: ReturnType<typeof calculateSlimeJourney>;

  constructor(config: JourneyConfig, callbacks: JourneyCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // Calculate journey details
    this.journeyDetails = calculateSlimeJourney(
      config.origin,
      config.destination,
      config.slimeType
    );

    // Setup event manager
    this.eventManager = new JourneyEventManager((event) => {
      this.handleEventTrigger(event);
    });

    // Schedule showcase event
    this.eventManager.scheduleShowcaseEvent(config.slimeType, config.journeyId);
  }

  /**
   * Start the journey
   */
  start() {
    if (this.isActive) return;

    this.isActive = true;

    // Setup animator
    this.animator = new JourneyAnimator({
      origin: this.config.origin,
      destination: this.config.destination,
      startTime: this.config.startTime,
      duration: this.journeyDetails.durationSeconds,
      onPositionUpdate: (position, progress) => {
        this.handlePositionUpdate(position, progress);
      },
      onComplete: () => {
        this.handleJourneyComplete();
      },
    });

    this.animator.start();

    // Start status update interval (every second)
    this.updateInterval = setInterval(() => {
      this.emitStatusUpdate();
    }, 1000);

    console.log(
      `Journey started: ${this.journeyDetails.formattedDistance}, ETA: ${this.getFormattedETA()}`
    );
  }

  /**
   * Stop the journey
   */
  stop() {
    this.isActive = false;

    if (this.animator) {
      this.animator.stop();
      this.animator = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Pause the journey (for events)
   */
  pause(durationSeconds: number) {
    if (!this.isActive || !this.animator) return;

    this.eventPauseEndTime = new Date(Date.now() + durationSeconds * 1000);
    this.animator.stop();

    console.log(`Journey paused for ${durationSeconds}s`);

    // Resume after pause duration
    setTimeout(() => {
      if (this.isActive && this.animator) {
        this.animator.start();
        this.eventPauseEndTime = null;
        console.log('Journey resumed');
      }
    }, durationSeconds * 1000);
  }

  /**
   * Handle position update from animator
   */
  private handlePositionUpdate(position: Coordinate, progress: number) {
    // Update event manager
    this.eventManager.updateProgress(progress);

    // Notify callback
    if (this.callbacks.onPositionUpdate) {
      this.callbacks.onPositionUpdate(position, progress);
    }
  }

  /**
   * Handle event trigger
   */
  private handleEventTrigger(event: JourneyEvent) {
    this.activeEvent = event;

    // Notify callback
    if (this.callbacks.onEventTriggered) {
      this.callbacks.onEventTriggered(event);
    }

    // Handle event effects
    if (event.effect?.pauseSeconds) {
      this.pause(event.effect.pauseSeconds);
    }

    // Clear active event after display duration
    setTimeout(() => {
      if (this.activeEvent?.id === event.id) {
        this.activeEvent = null;
      }
    }, 5000); // Display event for 5 seconds
  }

  /**
   * Handle journey completion
   */
  private handleJourneyComplete() {
    this.isActive = false;

    if (this.callbacks.onJourneyComplete) {
      this.callbacks.onJourneyComplete();
    }

    console.log('Journey completed!');
  }

  /**
   * Get current journey status
   */
  getStatus(): JourneyStatus {
    const now = new Date();
    const progress = calculateProgress(this.config.startTime, this.journeyDetails.durationSeconds);
    const currentPosition = interpolatePosition(this.config.origin, this.config.destination, progress);

    const totalTimeMs = this.journeyDetails.durationSeconds * 1000;
    const elapsedMs = now.getTime() - this.config.startTime.getTime();
    const remainingMs = Math.max(0, totalTimeMs - elapsedMs);
    const timeRemaining = remainingMs / 1000;

    const distanceRemaining = this.journeyDetails.distanceMeters * (1 - progress);
    const eta = calculateETA(this.config.startTime, this.journeyDetails.durationSeconds);

    return {
      journeyId: this.config.journeyId,
      currentPosition,
      progress,
      isMoving: this.isActive && progress < 1,
      distanceRemaining,
      timeRemaining,
      eta,
      formattedETA: formatETA(eta),
      formattedTimeRemaining: formatDuration(timeRemaining),
      activeEvent: this.activeEvent,
      upcomingEvents: this.eventManager.getUpcomingEvents(),
      triggeredEvents: this.eventManager.getTriggeredEvents(),
    };
  }

  /**
   * Emit status update to callback
   */
  private emitStatusUpdate() {
    if (this.callbacks.onStatusUpdate) {
      this.callbacks.onStatusUpdate(this.getStatus());
    }
  }

  /**
   * Get journey configuration
   */
  getConfig(): JourneyConfig {
    return { ...this.config };
  }

  /**
   * Get journey details (distance, duration, etc.)
   */
  getJourneyDetails() {
    return { ...this.journeyDetails };
  }

  /**
   * Get formatted ETA
   */
  getFormattedETA(): string {
    const eta = calculateETA(this.config.startTime, this.journeyDetails.durationSeconds);
    return formatETA(eta);
  }

  /**
   * Check if journey is active
   */
  isJourneyActive(): boolean {
    return this.isActive;
  }

  /**
   * Check if journey is paused
   */
  isJourneyPaused(): boolean {
    return this.eventPauseEndTime !== null && this.eventPauseEndTime > new Date();
  }

  /**
   * Get active event
   */
  getActiveEvent(): JourneyEvent | null {
    return this.activeEvent;
  }

  /**
   * Reset journey (for testing)
   */
  reset() {
    this.stop();
    this.eventManager.reset();
    this.activeEvent = null;
    this.eventPauseEndTime = null;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    this.eventManager.reset();
  }
}

/**
 * Create a journey manager from backend journey data
 * @param journeyData Journey data from backend API
 * @param callbacks Event callbacks
 * @returns Configured JourneyManager instance
 */
export function createJourneyManager(
  journeyData: {
    id: string;
    slime_id: string;
    start_lat: number;
    start_lng: number;
    dest_lat: number;
    dest_lng: number;
    place_name: string;
    place_reason: string;
    created_at: string;
  },
  slimeData: {
    slime_type: string;
    name: string;
  },
  callbacks: JourneyCallbacks = {}
): JourneyManager {
  const config: JourneyConfig = {
    journeyId: journeyData.id,
    slimeId: journeyData.slime_id,
    slimeType: slimeData.slime_type,
    slimeName: slimeData.name || 'Your Slime',
    origin: {
      lat: journeyData.start_lat,
      lng: journeyData.start_lng,
    },
    destination: {
      lat: journeyData.dest_lat,
      lng: journeyData.dest_lng,
    },
    startTime: new Date(journeyData.created_at),
    placeName: journeyData.place_name,
    placeReason: journeyData.place_reason,
  };

  return new JourneyManager(config, callbacks);
}

/**
 * Export all types and utilities
 */
export * from './journeyAnimation';
export * from './journeyEvents';
export * from './walkingTime';
