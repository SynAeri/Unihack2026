# Design Brief — Slime Journey Map (React Native + MapLibre)

## Priority Rule
This brief is subordinate to the main project goal.

If any task in this document:
- overlaps with the main project in a way that creates duplicated systems,
- conflicts with existing core gameplay or product direction,
- weakens performance, maintainability, or the intended purpose of the main project,
- or changes behaviour that the primary project depends on,

then **the main project goal takes precedence** and this brief should be ignored, reduced, or adapted accordingly.

---

## Brief Summary
Build an interactive, stylish 3D map experience in the React Native app using MapLibre. The map should act as both:

1. a presentation layer for slime travel,
2. and a practical GPS-like tracker so the user can find their slime when it decides to move.

Once the slime initiates movement and `loc_search` returns a destination, the app should animate a journey from the slime’s previous geolocation to the destination. A slime image/icon should be placed at the previous location, an arrow or route direction should indicate where it is heading, and the slime marker should move in real time along the route using a linear tween.

During the journey, `generate_random_event` should be triggered at a random time so that one random event occurs at least once during the trip for showcase purposes.

---

## Product Goal
Create a map-based movement system that feels playful and readable rather than purely utilitarian.

The user should be able to:
- open the map and understand where the slime was,
- see where it is going,
- watch the movement animate in real time,
- understand the trip duration using a simple walking-time approximation,
- and observe at least one event during transit.

---

## User Experience Intent
The system should feel:
- playful,
- slightly funny,
- stylised rather than clinical,
- readable at a glance,
- and good enough for live showcase/demo use.

The slime marker should not feel like a generic GPS pin. It should feel like a character moving through the world.

---

## Core Scenario
1. Slime movement is initiated.
2. Backend or movement logic determines the next destination.
3. `loc_search` returns the selected destination plus any route-relevant metadata.
4. The client places the slime image on the previous geolocation.
5. The map shows a directional arrow and/or path toward the new destination.
6. Travel time is calculated using a generalised walking-speed formula.
7. The slime animates from origin to destination in real time with a linear tween.
8. At one random point during the journey, `generate_random_event` fires.
9. The event is surfaced in the UI while movement continues or briefly pauses depending on event design.
10. The map doubles as a tracker/GPS view for locating the slime.

---

## Technical Feasibility Note
This is feasible with MapLibre in a React Native stack.

MapLibre supports:
- custom map views in React Native,
- runtime image assets,
- symbol layers and line layers for markers/routes,
- GeoJSON-backed sources that can be updated at runtime,
- and camera control for following movement.

That means the core idea is realistic:
- use a slime image as a custom icon,
- render a route line and optional directional symbols/arrows,
- update the slime feature coordinates over time,
- and animate the camera or keep it static depending on UX choice.

The map itself does not calculate walking behaviour for you. That part should be handled by app logic or backend logic:
- choose origin and destination,
- calculate distance,
- convert distance into travel duration,
- schedule the random event time,
- and stream or simulate position updates to the map.

So yes: the “funny image of a person/slime moving from one point to another via arrow” part is absolutely doable. The hard part is not MapLibre rendering — it is clean state orchestration.

---

## Frontend Scope

### Map Presentation
Implement an interactive map screen using MapLibre React Native.

The screen should support:
- a stylised 3D-capable map style,
- custom slime image/icon rendering,
- a route line between origin and destination,
- directional arrow indicators where useful,
- optional camera follow mode,
- and a travel/event overlay UI.

### Slime Marker Behaviour
The slime should be represented by a custom image marker or symbol.

Preferred implementation:
- a `ShapeSource` containing the slime feature,
- a `SymbolLayer` using the slime image,
- and position updates pushed into the source as coordinates change.

This is preferred over view-heavy annotations for smoother runtime updates.

### Route Rendering
The journey path should be drawn using a GeoJSON line feature.

The map should render:
- current origin,
- destination,
- route line,
- and optionally repeating direction arrows or a destination arrow symbol.

### Animation
The frontend should tween the slime coordinate from origin to destination.

For showcase simplicity:
- use a linear tween,
- move along route progress using elapsed time / total duration,
- and refresh the displayed coordinate on an interval or animation frame.

### Event Display
When a random event occurs:
- show an event card, bubble, or small modal,
- optionally pause or slow movement depending on the event type,
- log the event in journey state,
- then continue until arrival.

### GPS / Tracking Mode
The map should also serve as a “find your slime” interface.

This means:
- the most recent slime location must always be recoverable,
- the current journey state must survive app backgrounding where possible,
- and re-opening the map should reconstruct the current movement state from persisted backend/client state.

---

## Backend / Service Design Scope
The backend processes below are the important part of this brief.

## Required Backend Processes

### 1. Movement Intent Resolver
A service is needed to decide when the slime moves and where it goes.

Responsibilities:
- determine whether movement starts,
- choose the destination candidate,
- validate that destination,
- and create a movement record.

Inputs may include:
- slime current position,
- behavioural rules,
- allowed movement radius,
- cooldowns,
- and environmental or user-state conditions.

Outputs should include:
- movement session ID,
- origin coordinates,
- destination coordinates,
- movement start time,
- calculated duration,
- estimated arrival time,
- and journey status.

### 2. `loc_search` Process
`loc_search` should not just return a raw location.
It should return a structured movement target payload suitable for the map and animation layer.

Suggested response shape:

```json
{
  "movementId": "mv_123",
  "origin": { "lat": 0, "lng": 0 },
  "destination": { "lat": 0, "lng": 0 },
  "destinationLabel": "Park path",
  "distanceMeters": 0,
  "durationSeconds": 0,
  "routeMode": "straight_line",
  "startedAt": "ISO_DATE",
  "eta": "ISO_DATE"
}
```

Minimum backend requirement:
- return origin and destination reliably.

Better version:
- also return route geometry if route snapping is desired.

### 3. Distance + Time Calculation Service
A service is required to generalise walking time between points.

Minimum formula:
- compute geodesic distance between origin and destination,
- divide by assumed walking speed,
- convert to seconds.

Example baseline:
- walking speed ≈ 1.2 to 1.4 metres/second.

Suggested default:
- `durationSeconds = distanceMeters / 1.3`

This should be configurable so game feel can be tuned later.

Important:
This is a game-style approximation, not a real pedestrian routing guarantee.

### 4. Journey State Store
A persistent store is needed for active and historical journeys.

Store fields should include:
- movement ID,
- slime ID,
- origin,
- destination,
- route geometry or interpolation mode,
- startedAt,
- eta,
- current status,
- event schedule,
- event result,
- and last known computed position.

Statuses may include:
- `queued`
- `moving`
- `event_triggered`
- `arrived`
- `cancelled`

### 5. Real-Time Position Resolver
The system needs a way to calculate the slime’s current position during travel.

Two valid approaches:

#### Option A — Server-authoritative position
Backend computes current position from `startedAt`, `durationSeconds`, and route progress.
The client polls or subscribes for the current coordinate.

Pros:
- single source of truth,
- better for persistence across devices,
- easier anti-cheat/state integrity.

Cons:
- more backend load.

#### Option B — Client-simulated position with server timestamps
Backend stores origin/destination/start/end time.
Client reconstructs progress locally.

Pros:
- lighter backend,
- easier for demo/showcase.

Cons:
- more room for drift unless time is reconciled.

Recommended for now:
- use backend timestamps plus client-side interpolation.
- keep the backend authoritative on movement session data.

### 6. `generate_random_event` Scheduler
A process must guarantee that one random event occurs during the journey for showcase purposes.

Requirements:
- once movement starts, generate a random event time between safe progress bounds,
- ensure exactly one event occurs for the showcase flow,
- store the event trigger point in the journey state,
- and return or expose the event payload when journey progress crosses that threshold.

Suggested scheduling rule:
- choose a trigger at 20%–80% of trip progress,
- avoid events too close to start or arrival.

Suggested event payload:

```json
{
  "eventId": "evt_001",
  "movementId": "mv_123",
  "triggerProgress": 0.46,
  "eventType": "slime_found_snack",
  "title": "Snack Detour",
  "description": "The slime got distracted by something edible.",
  "effect": {
    "pauseSeconds": 8
  }
}
```

### 7. Journey Progress API
The client needs a clean way to fetch and refresh movement state.

Suggested endpoints:
- `POST /slime/movement/start`
- `GET /slime/movement/active`
- `GET /slime/movement/:id`
- `GET /slime/movement/:id/progress`
- `POST /slime/movement/:id/event/ack`

Suggested `progress` response:

```json
{
  "movementId": "mv_123",
  "status": "moving",
  "origin": { "lat": 0, "lng": 0 },
  "destination": { "lat": 0, "lng": 0 },
  "currentPosition": { "lat": 0, "lng": 0 },
  "progress": 0.37,
  "startedAt": "ISO_DATE",
  "eta": "ISO_DATE",
  "activeEvent": null
}
```

### 8. Recovery / Resume Logic
If the app closes during movement, the backend must let the client rebuild state.

That means the backend should support:
- fetching the active movement session,
- reconstructing progress based on timestamps,
- re-sending pending random event state,
- and reporting arrival if the travel window has completed.

### 9. Arrival Finalisation Process
When journey progress reaches 100%:
- mark the slime as arrived,
- update the slime’s canonical current location,
- clear active movement state,
- persist journey history,
- and emit any arrival-side effects.

### 10. Conflict Protection
Because this brief is secondary to the main project, backend systems must not duplicate or override the main movement architecture.

Protection rule:
- if an existing movement/session/state machine already exists, integrate with it rather than inventing a second one.

Do not create:
- duplicate truth sources for slime location,
- conflicting event schedulers,
- or a second destination system that breaks the main project rules.

---

## Suggested Architecture

### Frontend
- React Native screen for map view
- MapLibre map component
- map source/layer setup for route and slime symbol
- local animation/interpolation controller
- journey overlay UI
- event notification UI

### Backend
- movement orchestration service
- `loc_search` destination resolver
- duration calculator
- journey state persistence
- event scheduler for `generate_random_event`
- journey progress endpoint
- arrival finaliser

### Shared Contracts
- strongly typed journey payloads
- stable IDs for movement and events
- versioned response shapes if this evolves

---

## Visual / Interaction Requirements

### 3D / Stylish Feel
The map should not look flat and boring.
Possible enhancements:
- slight map pitch,
- camera tilt during movement,
- subtle zooming when journey starts,
- elevated terrain/buildings if style supports it,
- soft route glow,
- and a deliberately funny slime icon.

### Slime Motion Readability
The movement must be obvious.

Required cues:
- visible origin and destination relationship,
- direction arrow or heading cue,
- route line or direct path,
- and a clear moving icon.

### Demo Clarity
For showcase purposes, the movement and event should be easy to notice.
That matters more than realism.

---

## Data Contracts

### Movement Start Contract
The frontend needs enough information to start animation immediately.

Minimum contract:
- movement ID
- origin
- destination
- duration
- start time
- event schedule summary or event-enabled flag

### Movement Progress Contract
The frontend needs enough information to recover from refresh/backgrounding.

Minimum contract:
- movement status
- current progress
- current position or enough timestamps to derive it
- event status
- ETA

---

## State Rules

### Rule 1
Main project systems always win.

### Rule 2
Movement must use a single authoritative journey record.

### Rule 3
Exactly one random event must occur during showcase-mode travel.

### Rule 4
Map rendering should consume journey state, not invent it.

### Rule 5
If `loc_search` fails or returns invalid output, no movement animation should begin.

---

## Failure Cases
The system should explicitly handle:
- `loc_search` returns no destination,
- invalid coordinates,
- duration too small or zero,
- app resumes after ETA has passed,
- event trigger missed during app suspension,
- duplicate movement creation,
- and backend/client clock drift.

---

## MVP Build Order
1. Render MapLibre map in React Native.
2. Render slime icon at a fixed coordinate.
3. Render destination and route line.
4. Implement duration calculation.
5. Create journey state payload from `loc_search`.
6. Animate slime from origin to destination linearly.
7. Add one random event trigger during travel.
8. Add resume/recovery from persisted journey timestamps.
9. Add polish: camera follow, arrows, 3D styling, event UI.

---

## Recommendation
Build this in a way where the backend owns:
- where the slime is going,
- when the movement started,
- how long the movement should last,
- and when the event should occur.

Let the frontend own:
- how the journey is visually animated,
- how the route looks,
- how the slime icon feels,
- and how the event is presented.

That split keeps the logic clean and stops the map from becoming the source of truth.

---

## Final Note
This feature is absolutely possible with MapLibre.
The actual risk is not “can the map render this?”
It can.

The real risk is bad ownership boundaries.
If movement logic, journey timing, event scheduling, and canonical slime location are split badly across frontend and backend, the system will get messy fast.

So the design brief should be treated as:
- a map visualisation feature,
- backed by a single movement state model,
- with strict deference to the existing project goal and architecture.
