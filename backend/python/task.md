
Yes. Here’s a backend handoff you can send.

---

# Backend Setup Brief — Spatial Slime Companion

## Project point

We are building a **spatial computing companion app** where a user scans a real-world object, a slime is generated from that object, and the slime then explores nearby real-world places based on its personality.

The goal is not just a pet app. The goal is to create a **light AR + geospatial exploration loop** that makes users interact with their environment more.

Examples:

* scan a **book** → generate a quiet / curious slime → prefers libraries or quiet cafés
* scan **food** → generate a social / glutton slime → prefers cafés / restaurants / dessert places
* scan a **sport item** → generate an energetic slime → prefers parks / gyms

The slime can:

* travel from A to B on a real map
* get sidetracked by random events
* ask the user for things like food/drink
* build bond level
* later potentially meet other users’ slimes

---

# Core product flow

## Main user flow

1. user opens app
2. user enters a simple username login
3. user scans an object
4. frontend / vision layer classifies object into broad class:

   * `book`
   * `food`
   * `sport`
   * `other`
5. backend interprets that scan into slime creation data
6. slime is created and stored
7. user asks slime to explore or slime chooses to explore
8. backend picks a destination based on slime personality + user location
9. frontend shows slime moving from current point to destination
10. during travel, events may happen
11. user can interact with slime, including feeding it by scanning an object
12. slime state, bond, events, and journeys persist in DB

---

# Architecture

## Stack

* **Frontend:** React Native / Expo / AR layer
* **Backend API:** FastAPI
* **Persistence:** Supabase
* **External APIs:** Google Places later
* **Object recognition:** mobile-side / on-device, backend only receives interpreted payload

## Backend role

Backend should own:

* user creation/loading
* slime creation and state updates
* journey creation
* event generation/storage
* future place selection logic
* future encounter logic

## Supabase role

Supabase should store:

* users
* slimes
* journeys
* events
* later encounters / memories / traits

Frontend should talk to **FastAPI**, and FastAPI should talk to **Supabase**.

So overall:

```text
Frontend -> FastAPI -> Supabase
```

---

# Recommended folder structure

Use modular route separation.

```text
backend/
├─ .env
├─ requirements.txt
├─ endpoints/
│  ├─ __init__.py
│  ├─ main.py
│  ├─ config.py
│  ├─ db.py
│  ├─ schemas.py
│  ├─ utils.py
│  └─ routes/
│     ├─ __init__.py
│     ├─ auth.py
│     ├─ slime.py
│     ├─ nav.py
│     ├─ events.py
│     ├─ interaction.py
│     ├─ debug.py
│     └─ health.py
```

## Folder / file responsibility

### `endpoints/main.py`

Central FastAPI app entrypoint.

* create app
* attach middleware
* include routers

### `endpoints/config.py`

Env loading.

* Supabase URL
* Supabase secret key
* later Google Places key

### `endpoints/db.py`

Single shared Supabase client.

### `endpoints/schemas.py`

Pydantic request/response models.

### `endpoints/utils.py`

Shared helper logic:

* infer personality from object class
* event generation
* place category mapping
* food validation logic

### `endpoints/routes/auth.py`

Authentication-ish routes.

* mock username login

### `endpoints/routes/slime.py`

Slime creation / retrieval / state / bond

### `endpoints/routes/nav.py`

Navigation and journey logic.
Anything related to:

* starting journey
* getting current journey
* progress
* place selection
  should live here

### `endpoints/routes/events.py`

Event creation / retrieval

### `endpoints/routes/interaction.py`

Feeding, state changes, interaction with slime

### `endpoints/routes/debug.py`

Testing helpers / forced states / demo fallback

### `endpoints/routes/health.py`

Healthcheck routes

---

# Env setup

Use a `.env` file at backend root.

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
```

Later add:

```env
GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_KEY
```

Use `python-dotenv` and load the file from `config.py`.

---

# SQL / Supabase setup

Use Supabase **Table Editor** for speed or SQL Editor if easier.

## Minimum tables needed

### `users`

Stores demo identity.

Columns:

* `id` uuid primary key default `gen_random_uuid()`
* `username` text unique not null
* `created_at` timestamptz default `now()`

### `slimes`

Stores the current or created slime.

Columns:

* `id` uuid primary key default `gen_random_uuid()`
* `user_id` uuid foreign key → `users.id`
* `slime_type` text not null
* `personality` jsonb
* `bond_level` int default `0`
* `state` text default `'idle'`
* `dominant_color` text
* `created_at` timestamptz default `now()`

### `journeys`

Stores navigation sessions.

Columns:

* `id` uuid primary key default `gen_random_uuid()`
* `slime_id` uuid foreign key → `slimes.id`
* `start_lat` double precision
* `start_lng` double precision
* `dest_lat` double precision
* `dest_lng` double precision
* `progress` double precision default `0`
* `status` text default `'active'`
* `place_name` text
* `place_reason` text
* `created_at` timestamptz default `now()`

### `events`

Stores slime history / random events / interactions.

Columns:

* `id` uuid primary key default `gen_random_uuid()`
* `slime_id` uuid foreign key → `slimes.id`
* `event_type` text
* `message` text
* `created_at` timestamptz default `now()`

---

# SQL format to use

If using SQL Editor, use something like this:

```sql
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamptz default now()
);

create table if not exists slimes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  slime_type text not null,
  personality jsonb,
  bond_level int default 0,
  state text default 'idle',
  dominant_color text,
  created_at timestamptz default now()
);

create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  slime_id uuid references slimes(id) on delete cascade,
  start_lat double precision,
  start_lng double precision,
  dest_lat double precision,
  dest_lng double precision,
  progress double precision default 0,
  status text default 'active',
  place_name text,
  place_reason text,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slime_id uuid references slimes(id) on delete cascade,
  event_type text,
  message text,
  created_at timestamptz default now()
);
```

---

# Route groups and endpoints to build

## 1. Health routes — `routes/health.py`

### `GET /`

Returns:

```json
{ "ok": true }
```

### `GET /health`

Returns:

```json
{ "status": "healthy" }
```

Purpose:

* backend sanity check
* used to confirm server is alive

---

## 2. Auth routes — `routes/auth.py`

### `POST /login`

Purpose:

* mock login using username only
* find user if exists
* create user if not

Input:

```json
{
  "username": "earie"
}
```

Output:

```json
{
  "id": "uuid",
  "username": "earie",
  "created_at": "..."
}
```

Notes:

* no real password/auth required
* this is demo identity only

---

## 3. Slime routes — `routes/slime.py`

### `GET /users/{user_id}/slime`

Purpose:

* fetch most recent or active slime for user

### `POST /interpret-image`

Purpose:

* create slime from interpreted scan data

Input:

```json
{
  "user_id": "uuid",
  "object_class": "book",
  "dominant_color": "#6A7BA2",
  "labels": ["book", "publication"]
}
```

Expected logic:

* map `object_class` into slime type
* infer simple personality object
* insert slime row
* create birth event

Output:

```json
{
  "slime": { ... },
  "personality": {
    "temperament": "quiet",
    "interest": "study",
    "preferred_places": ["library", "quiet cafe"]
  }
}
```

### `POST /slimes/{slime_id}/state`

Purpose:

* update slime state

Accepted states:

* `idle`
* `exploring`
* `hungry`
* `curious`
* `resting`

### `POST /slimes/{slime_id}/bond`

Optional route if backend wants direct bond updates.
Can also be skipped if bond updates happen inside feed/journey/event routes.

---

## 4. Navigation routes — `routes/nav.py`

Anything journey/location related goes here.

### `POST /journeys/start`

Purpose:

* start a journey based on user current location + slime personality

Input:

```json
{
  "user_id": "uuid",
  "current_lat": -33.87,
  "current_lng": 151.21
}
```

Expected logic:

* load user slime
* map slime type to preferred place category
* for now fake location offset
* later call Google Places
* create journey row
* set slime state to `exploring`

Output:

```json
{
  "journey": { ... },
  "destination": {
    "name": "Suggested place for book slime",
    "lat": -33.8685,
    "lng": 151.212,
    "reason": "quiet cafe OR library"
  }
}
```

### `GET /journeys/{journey_id}`

Purpose:

* fetch one journey

### `POST /journeys/{journey_id}/progress`

Purpose:

* update journey progress if backend persists progress

Input:

```json
{
  "progress": 0.42
}
```

### `POST /journeys/{journey_id}/complete`

Optional but useful.
Purpose:

* mark as complete
* update slime state
* create arrival event

### `POST /journeys/{journey_id}/event-roll`

Purpose:

* generate a mid-journey random event

Expected logic:

* load slime by journey
* generate one small event message
* store it in events table
* return it

---

## 5. Event routes — `routes/events.py`

### `GET /slimes/{slime_id}/events`

Purpose:

* get event history for slime

### `POST /events/create`

Optional generic route.
Purpose:

* create arbitrary event manually if needed

Input:

```json
{
  "slime_id": "uuid",
  "event_type": "sidetrack",
  "message": "Got distracted by a shiny bin lid."
}
```

---

## 6. Interaction routes — `routes/interaction.py`

### `POST /slimes/{slime_id}/feed`

Purpose:

* feed slime based on scan result

Input:

```json
{
  "food_class": "drink",
  "labels": ["coffee", "cup", "drink"]
}
```

Expected logic:

* determine whether food is acceptable
* if yes:

  * increment bond
  * set state maybe to `idle`
  * create positive event
* if no:

  * create failed feed event
  * return rejection message

Output:

```json
{
  "success": true,
  "bond_delta": 1,
  "bond_level": 3,
  "message": "The slime happily ate it."
}
```

### `POST /slimes/{slime_id}/interact`

Optional generic interaction route.
For:

* pat
* tap
* encourage

Could be added later.

### `POST /slimes/{slime_id}/need`

Optional later route.
Set contextual needs such as:

* hungry
* wants coffee
* wants snack

---

## 7. Debug routes — `routes/debug.py`

Needed for hackathon sanity and demo safety.

### `POST /debug/seed-slime`

Purpose:

* create a slime without scan flow

### `POST /debug/start-journey/{slime_id}`

Purpose:

* instantly create journey for testing map UI

### `POST /debug/set-state`

Purpose:

* force a slime into a state like `hungry`

### `POST /debug/create-event`

Purpose:

* manually make an event to test event feed

These are very useful so the demo does not die if scan flow breaks.

---

# Suggested request models

Put in `schemas.py`.

Need at least:

* `LoginRequest`
* `InterpretImageRequest`
* `StartJourneyRequest`
* `JourneyProgressRequest`
* `FeedSlimeRequest`
* `SetStateRequest`
* `DebugSeedSlimeRequest`

Keep request bodies typed with Pydantic.

---

# Suggested helper functions

Put in `utils.py`.

## Personality inference

Example:

* `book` → quiet / study / library
* `food` → social / snacks / cafe
* `sport` → energetic / exercise / gym/park

## Place query mapping

Map slime type to destination query string.

## Event generation

Return a small random event pair:

* event_type
* message

## Food validation

Given `food_class` and labels, determine whether feed should succeed.

---

# Implementation priorities

## Phase A — absolute must

Build these first:

* `GET /`
* `GET /health`
* `POST /login`
* `POST /interpret-image`
* `GET /users/{user_id}/slime`
* `POST /journeys/start`
* `GET /journeys/{journey_id}`
* `GET /slimes/{slime_id}/events`
* `POST /slimes/{slime_id}/feed`

## Phase B — strong additions

* `POST /journeys/{journey_id}/event-roll`
* `POST /slimes/{slime_id}/state`
* `POST /debug/seed-slime`
* `POST /debug/start-journey/{slime_id}`

## Phase C — later / stretch

* `POST /journeys/{journey_id}/complete`
* `POST /slimes/{slime_id}/interact`
* `POST /encounters/check`
* `POST /slimes/{slime_id}/need`

---

# Fake-first approach

For hackathon speed:

* **do not** implement full Google Places immediately
* **do not** implement full AI route selection immediately
* **do not** overbuild auth

Instead:

* fake a destination by small lat/lng offset first
* fake events from backend random generator
* fake hunger/need triggers manually at first
* keep login username-only

Then replace one component at a time.

---

# Backend coding expectations

## Use FastAPI normally

* run with uvicorn
* modular routes
* Swagger docs should work at `/docs`

## Use Supabase as persistence only

* FastAPI calls Supabase using secret key
* frontend should not call Supabase directly for core app logic

## Keep route ownership clean

* all navigation logic in `routes/nav.py`
* all slime state logic in `routes/slime.py`
* all interaction logic in `routes/interaction.py`
* all event feed logic in `routes/events.py`

Do not dump all endpoints into one file.

---

# Final backend target

At MVP completion, backend should support this exact loop:

1. user logs in with username
2. scan interpretation payload hits `/interpret-image`
3. slime is created and stored
4. frontend fetches slime
5. user starts exploration via `/journeys/start`
6. backend creates destination and journey
7. frontend animates journey
8. backend can generate mid-journey events
9. user can feed slime using `/slimes/{id}/feed`
10. event history can be retrieved and shown

---

If you want, I can turn this into an even more practical handoff with:

* exact file contents for each route file
* exact Pydantic models
* exact starter SQL
  all in one copy-paste bundle.
