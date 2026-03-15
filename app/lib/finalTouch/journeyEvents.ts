// Random event system for journey travel
// Generates and schedules random events during slime movement, connects to backend event generation

export interface JourneyEvent {
  id: string;
  movementId: string;
  triggerProgress: number; // 0-1, when event should trigger
  eventType: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
  effect?: {
    pauseSeconds?: number;
    speedMultiplier?: number;
  };
  timestamp: Date;
}

/**
 * Generate random event trigger point within safe bounds
 * Events should occur between 20% and 80% of journey progress
 * @returns Progress value between 0.2 and 0.8
 */
export function generateEventTriggerPoint(): number {
  const minProgress = 0.2;
  const maxProgress = 0.8;
  return minProgress + Math.random() * (maxProgress - minProgress);
}

/**
 * Generate a random journey event based on slime personality
 * @param slimeType Type of slime (scholar, glutton, athlete, wanderer)
 * @param movementId Journey/movement ID
 * @returns Generated event object
 */
export function generateRandomEvent(
  slimeType: string,
  movementId: string
): JourneyEvent {
  const triggerProgress = generateEventTriggerPoint();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Event templates based on slime type
  const eventTemplates: Record<string, Array<Omit<JourneyEvent, 'id' | 'movementId' | 'triggerProgress' | 'timestamp'>>> = {
    scholar: [
      {
        eventType: 'curiosity',
        title: 'Bookshop Discovery',
        description: 'Your slime noticed an interesting bookshop and stopped to peek inside.',
        icon: 'book',
        effect: { pauseSeconds: 8 },
      },
      {
        eventType: 'sidetrack',
        title: 'Reading Sign',
        description: 'Got distracted reading a historical marker along the way.',
        icon: 'information-circle',
        effect: { pauseSeconds: 5 },
      },
      {
        eventType: 'rest',
        title: 'Quiet Moment',
        description: 'Found a peaceful bench and paused to rest.',
        icon: 'pause-circle',
        effect: { pauseSeconds: 10 },
      },
    ],
    glutton: [
      {
        eventType: 'hunger',
        title: 'Snack Detour',
        description: 'The slime got distracted by the smell of fresh bread!',
        icon: 'fast-food',
        effect: { pauseSeconds: 12 },
      },
      {
        eventType: 'curiosity',
        title: 'Cafe Spotted',
        description: 'Noticed a cozy cafe and wants to explore.',
        icon: 'cafe',
        effect: { pauseSeconds: 8 },
      },
      {
        eventType: 'sidetrack',
        title: 'Food Stand',
        description: 'Can\'t resist checking out a street food vendor.',
        icon: 'nutrition',
        effect: { pauseSeconds: 10 },
      },
    ],
    athlete: [
      {
        eventType: 'energy',
        title: 'Energetic Sprint',
        description: 'Got a burst of energy and picked up the pace!',
        icon: 'flash',
        effect: { speedMultiplier: 1.5 },
      },
      {
        eventType: 'curiosity',
        title: 'Jogger Encounter',
        description: 'Spotted someone jogging and wants to follow!',
        icon: 'walk',
        effect: { pauseSeconds: 6 },
      },
      {
        eventType: 'sidetrack',
        title: 'Park Detour',
        description: 'Got excited and took a small detour through the park.',
        icon: 'leaf',
        effect: { pauseSeconds: 8 },
      },
    ],
    wanderer: [
      {
        eventType: 'exploration',
        title: 'Shiny Discovery',
        description: 'Found something shiny and stopped to investigate!',
        icon: 'sparkles',
        effect: { pauseSeconds: 7 },
      },
      {
        eventType: 'curiosity',
        title: 'Corner Investigation',
        description: 'Wondering what\'s around the corner...',
        icon: 'compass',
        effect: { pauseSeconds: 5 },
      },
      {
        eventType: 'exploration',
        title: 'Adventure Mode',
        description: 'Loving this adventure and exploring the surroundings!',
        icon: 'telescope',
        effect: { pauseSeconds: 9 },
      },
    ],
  };

  const templates = eventTemplates[slimeType.toLowerCase()] || eventTemplates.wanderer;
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    ...template,
    id: eventId,
    movementId,
    triggerProgress,
    timestamp: new Date(),
  };
}

/**
 * Check if an event should be triggered based on current progress
 * @param event Event to check
 * @param currentProgress Current journey progress (0-1)
 * @param lastCheckedProgress Previous progress value
 * @returns True if event should trigger
 */
export function shouldTriggerEvent(
  event: JourneyEvent,
  currentProgress: number,
  lastCheckedProgress: number
): boolean {
  // Event triggers if we've crossed its trigger point
  return (
    lastCheckedProgress < event.triggerProgress &&
    currentProgress >= event.triggerProgress
  );
}

/**
 * Journey event manager for handling event scheduling and triggering
 */
export class JourneyEventManager {
  private events: JourneyEvent[] = [];
  private triggeredEvents: Set<string> = new Set();
  private lastProgress: number = 0;
  private onEventTrigger: (event: JourneyEvent) => void;

  constructor(onEventTrigger: (event: JourneyEvent) => void) {
    this.onEventTrigger = onEventTrigger;
  }

  /**
   * Schedule a single random event for showcase mode
   * @param slimeType Type of slime
   * @param movementId Journey/movement ID
   */
  scheduleShowcaseEvent(slimeType: string, movementId: string) {
    const event = generateRandomEvent(slimeType, movementId);
    this.events = [event];
    console.log(
      `Event scheduled at ${Math.round(event.triggerProgress * 100)}% progress: ${event.title}`
    );
  }

  /**
   * Schedule multiple events for a journey
   * @param slimeType Type of slime
   * @param movementId Journey/movement ID
   * @param count Number of events to schedule
   */
  scheduleMultipleEvents(slimeType: string, movementId: string, count: number = 3) {
    this.events = [];
    for (let i = 0; i < count; i++) {
      const event = generateRandomEvent(slimeType, movementId);
      this.events.push(event);
    }
    // Sort events by trigger progress
    this.events.sort((a, b) => a.triggerProgress - b.triggerProgress);
    console.log(`Scheduled ${count} events for journey`);
  }

  /**
   * Update progress and check for event triggers
   * @param currentProgress Current journey progress (0-1)
   */
  updateProgress(currentProgress: number) {
    for (const event of this.events) {
      // Skip already triggered events
      if (this.triggeredEvents.has(event.id)) continue;

      if (shouldTriggerEvent(event, currentProgress, this.lastProgress)) {
        this.triggerEvent(event);
      }
    }

    this.lastProgress = currentProgress;
  }

  /**
   * Trigger an event
   * @param event Event to trigger
   */
  private triggerEvent(event: JourneyEvent) {
    this.triggeredEvents.add(event.id);
    this.onEventTrigger(event);
    console.log(`Event triggered: ${event.title}`);
  }

  /**
   * Get all scheduled events
   */
  getScheduledEvents(): JourneyEvent[] {
    return [...this.events];
  }

  /**
   * Get triggered events
   */
  getTriggeredEvents(): JourneyEvent[] {
    return this.events.filter((e) => this.triggeredEvents.has(e.id));
  }

  /**
   * Get upcoming events
   */
  getUpcomingEvents(): JourneyEvent[] {
    return this.events.filter((e) => !this.triggeredEvents.has(e.id));
  }

  /**
   * Reset event manager
   */
  reset() {
    this.events = [];
    this.triggeredEvents.clear();
    this.lastProgress = 0;
  }

  /**
   * Check if journey has any pending events
   */
  hasPendingEvents(): boolean {
    return this.events.some((e) => !this.triggeredEvents.has(e.id));
  }
}

/**
 * Calculate time until next event
 * @param currentProgress Current progress (0-1)
 * @param nextEventProgress Next event trigger progress
 * @param remainingSeconds Total remaining journey time
 * @returns Seconds until next event
 */
export function getTimeUntilNextEvent(
  currentProgress: number,
  nextEventProgress: number,
  remainingSeconds: number
): number {
  const progressRemaining = 1 - currentProgress;
  if (progressRemaining <= 0) return 0;

  const progressToEvent = nextEventProgress - currentProgress;
  const timeToEvent = (progressToEvent / progressRemaining) * remainingSeconds;

  return Math.max(0, timeToEvent);
}
