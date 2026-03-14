# Backend Implementation Memory

## Summary
Implemented the core FastAPI backend for the Spatial Slime Companion app following the task.md specifications. Created all Phase A (absolute must) endpoints and several Phase B endpoints, excluding only the navigation routes as requested.

## What Was Implemented

### 1. Core Files Created

#### `schemas.py` (backend/python/schemas.py)
- **Purpose**: Pydantic models for type-safe request/response validation
- **Contents**:
  - Auth schemas: `LoginRequest`, `UserResponse`
  - Slime schemas: `PersonalityData`, `InterpretImageRequest`, `InterpretImageResponse`, `SlimeResponse`, `SetStateRequest`
  - Journey schemas: `StartJourneyRequest`, `DestinationData`, `JourneyResponse`, `StartJourneyResponse`, `JourneyProgressRequest`
  - Event schemas: `EventResponse`, `CreateEventRequest`
  - Interaction schemas: `FeedSlimeRequest`, `FeedSlimeResponse`
  - Debug schemas: `DebugSeedSlimeRequest`, `DebugSetStateRequest`

#### `utils.py` (backend/python/utils.py)
- **Purpose**: Helper functions for game logic
- **Functions**:
  - `infer_personality(object_class)`: Maps object class (book/food/sport/other) to personality traits (temperament, interest, preferred_places)
  - `get_slime_type(object_class)`: Converts object class to slime type name (scholar/glutton/athlete/wanderer)
  - `generate_random_event(slime_type, personality)`: Creates random mid-journey events based on temperament
  - `validate_food(food_class, labels, slime_type)`: Validates scanned food and returns acceptance message
  - `get_place_category(slime_type, personality)`: Maps slime type to Google Places API categories
  - `generate_fake_destination(current_lat, current_lng, slime_type, personality)`: Generates fake destinations for testing (will be replaced with Google Places later)

### 2. Route Files Implemented

#### `routes/auth.py`
- **Endpoints**:
  - `POST /auth/login`: Mock username-based login, creates or retrieves user from Supabase
- **Database**: Connects to `users` table
- **Logic**: Check if username exists, create if not, return user data

#### `routes/slime.py`
- **Endpoints**:
  - `GET /slimes/users/{user_id}/slime`: Fetch most recent slime for user
  - `POST /slimes/interpret-image`: Create slime from scan data, infer personality, create birth event
  - `POST /slimes/{slime_id}/state`: Update slime state (idle/exploring/hungry/curious/resting)
- **Database**: Connects to `slimes` and `events` tables
- **Logic**: Uses utils.py helpers for personality inference and slime type mapping

#### `routes/events.py`
- **Endpoints**:
  - `GET /events/slimes/{slime_id}/events`: Get chronological event history for slime
  - `POST /events/create`: Manually create arbitrary event
- **Database**: Connects to `events` table
- **Logic**: Simple CRUD for event history

#### `routes/interaction.py`
- **Endpoints**:
  - `POST /interaction/slimes/{slime_id}/feed`: Feed slime based on scanned food
- **Database**: Connects to `slimes` and `events` tables
- **Logic**:
  - Validates food using `validate_food()` helper
  - Increments bond level on success
  - Sets state to idle (no longer hungry)
  - Creates feed event (success or failure)

#### `routes/debug.py`
- **Endpoints**:
  - `POST /debug/seed-slime`: Create slime without scan flow for testing
  - `POST /debug/set-state`: Force slime into specific state
  - `POST /debug/create-event`: Manually create test event
- **Database**: Connects to `slimes` and `events` tables
- **Logic**: Bypass normal flow for hackathon/demo safety

#### `routes/health.py` (already existed)
- **Endpoints**:
  - `GET /`: Returns backend status
  - `GET /health`: Returns health check

### 3. Updated Files

#### `main.py` (backend/python/main.py)
- **Changes**: Uncommented and included all routers
- **Routers included**: health, auth, slime, events, interaction, debug
- **Note**: Navigation/journey router intentionally excluded per user request

## What Was NOT Implemented (As Requested)

### Navigation Routes (`routes/journey.py`)
**User requested to ignore navigation section for now**. The following endpoints were NOT implemented:
- `POST /journeys/start`
- `GET /journeys/{journey_id}`
- `POST /journeys/{journey_id}/progress`
- `POST /journeys/{journey_id}/complete`
- `POST /journeys/{journey_id}/event-roll`

These can be added later when needed.

## Database Schema Reference

The implementation expects these Supabase tables (from task.md):

### `users`
- `id` (uuid, primary key)
- `username` (text, unique, not null)
- `created_at` (timestamptz)

### `slimes`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → users.id)
- `slime_type` (text, not null)
- `personality` (jsonb)
- `bond_level` (int, default 0)
- `state` (text, default 'idle')
- `dominant_color` (text)
- `created_at` (timestamptz)

### `journeys`
- `id` (uuid, primary key)
- `slime_id` (uuid, foreign key → slimes.id)
- `start_lat` (double precision)
- `start_lng` (double precision)
- `dest_lat` (double precision)
- `dest_lng` (double precision)
- `progress` (double precision, default 0)
- `status` (text, default 'active')
- `place_name` (text)
- `place_reason` (text)
- `created_at` (timestamptz)

### `events`
- `id` (uuid, primary key)
- `slime_id` (uuid, foreign key → slimes.id)
- `event_type` (text)
- `message` (text)
- `created_at` (timestamptz)

## Personality Mapping Logic

### Object Class → Slime Type
- `book` → `scholar` slime
- `food` → `glutton` slime
- `sport` → `athlete` slime
- `other` → `wanderer` slime

### Slime Type → Personality
- **Scholar**: quiet temperament, study interest, prefers library/quiet cafe/bookstore
- **Glutton**: social temperament, snacks interest, prefers cafe/restaurant/dessert shop
- **Athlete**: energetic temperament, exercise interest, prefers gym/park/sports center
- **Wanderer**: curious temperament, exploration interest, prefers park/plaza/general area

### Food Validation Logic
- All slimes accept food/drink/snack/beverage classes
- **Scholar slimes**: Prefer coffee/tea, accept others with less enthusiasm
- **Glutton slimes**: Love all food equally
- **Athlete slimes**: Prefer healthy food (fruit/vegetable/water), accept others with less enthusiasm
- **Wanderer slimes**: Accept everything equally
- Non-food items are rejected with "That's not food!" message

## API Testing Endpoints

### Recommended Testing Flow
1. `POST /auth/login` with `{"username": "testuser"}` → Get user_id
2. `POST /debug/seed-slime` with user_id and object_class → Get slime_id
3. `GET /slimes/users/{user_id}/slime` → Verify slime created
4. `GET /events/slimes/{slime_id}/events` → See birth event
5. `POST /interaction/slimes/{slime_id}/feed` with food data → Test feeding
6. `POST /debug/set-state` with state "hungry" → Change slime state
7. `GET /events/slimes/{slime_id}/events` → See all events history

### Debug Endpoints for Demo Safety
- `/debug/seed-slime`: Create slime without AR scan
- `/debug/set-state`: Force state changes
- `/debug/create-event`: Add test events

These ensure the demo won't fail if the AR/scan functionality breaks.

## File Structure

```
backend/python/
├── main.py                 # FastAPI app entrypoint, includes all routers
├── config.py              # Environment variable loading (Supabase URL/key)
├── db.py                  # Supabase client singleton
├── schemas.py             # Pydantic request/response models
├── utils.py               # Game logic helpers
└── routes/
    ├── __init__.py
    ├── health.py          # Health check endpoints
    ├── auth.py            # Login endpoint
    ├── slime.py           # Slime CRUD and state management
    ├── events.py          # Event history and creation
    ├── interaction.py     # Feeding and interactions
    ├── debug.py           # Testing helpers
    └── journey.py         # (NOT IMPLEMENTED - navigation ignored per user request)
```

## Environment Variables Required

In `backend/.env`:
```
Project_URL=https://YOUR_PROJECT.supabase.co
Secret_key=YOUR_SUPABASE_SECRET_KEY
```

Later add:
```
GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_KEY
```

## Implementation Status

### Phase A (Absolute Must) - ✅ COMPLETED
- ✅ `GET /`
- ✅ `GET /health`
- ✅ `POST /auth/login`
- ✅ `POST /slimes/interpret-image`
- ✅ `GET /slimes/users/{user_id}/slime`
- ⏸️ `POST /journeys/start` (navigation ignored)
- ⏸️ `GET /journeys/{journey_id}` (navigation ignored)
- ✅ `GET /events/slimes/{slime_id}/events`
- ✅ `POST /interaction/slimes/{slime_id}/feed`

### Phase B (Strong Additions) - ✅ COMPLETED (except navigation)
- ⏸️ `POST /journeys/{journey_id}/event-roll` (navigation ignored)
- ✅ `POST /slimes/{slime_id}/state`
- ✅ `POST /debug/seed-slime`
- ✅ `POST /debug/set-state`

### Phase C (Later/Stretch) - ⏸️ NOT IMPLEMENTED
- `POST /journeys/{journey_id}/complete`
- `POST /slimes/{slime_id}/interact`
- `POST /encounters/check`
- `POST /slimes/{slime_id}/need`

## Next Steps (When Ready)

1. **Add Navigation Routes**: Implement journey.py when ready to work on map/navigation
2. **Google Places Integration**: Replace `generate_fake_destination()` with real Google Places API calls
3. **Advanced Event Generation**: Make `generate_random_event()` more sophisticated with more event types
4. **Encounter System**: Implement slime-to-slime encounters (Phase C)
5. **Advanced Interactions**: Add pat/tap/encourage interactions (Phase C)

## Code Style Notes

- All files have informal comment headers explaining their purpose and connections
- Comments use informal style per CLAUDE.md rules
- FastAPI routers use prefix and tags for organization
- All database operations use the shared `supabase` client from `db.py`
- Error handling uses FastAPI HTTPException with appropriate status codes
- Response models use Pydantic for type safety
- Helper functions in utils.py keep route files clean and focused

## Running the Backend

```bash
cd backend/python
python -m uvicorn python.main:app --reload
```

Access Swagger docs at: `http://localhost:8000/docs`

---

## Updates from Task 2 (Storage + Assets)

### Schema Updates (schemas.py)
- Updated `SlimeAssets` to `SlimeAssetResponse` to match task2.md specification
- Added missing fields: `slime_id`, `file_name`, `mime_type`, `created_at`
- Made `asset_role`, `file_name`, and `mime_type` optional as per spec
- This schema aligns with the `slime_assets` table from task2.md SQL

### New Testing Routes (routes/testmanualendpoint.py)
Created comprehensive test endpoints under `/test` prefix for verifying database and configuration setup:

#### Database Health
- `GET /test/db/health`: Basic Supabase connectivity check
- `GET /test/config/check`: Verify environment variables are loaded
- `GET /test/health/full`: Comprehensive health check (database + tables + config)

#### Table Verification
- `GET /test/db/tables`: Check all required tables exist and are accessible

#### Per-Table Testing
Each main table has count and list endpoints:

**Users**:
- `GET /test/db/users/count`: Count of users
- `GET /test/db/users/all`: List all users (max 50)

**Slimes**:
- `GET /test/db/slimes/count`: Count of slimes
- `GET /test/db/slimes/all`: List all slimes (max 50)

**Events**:
- `GET /test/db/events/count`: Count of events
- `GET /test/db/events/recent`: 20 most recent events

**Journeys**:
- `GET /test/db/journeys/count`: Count of journeys
- `GET /test/db/journeys/all`: List all journeys (max 50)

**Slime Assets** (NEW from task2):
- `GET /test/db/slime-assets/count`: Count of slime assets
- `GET /test/db/slime-assets/all`: List all assets (max 50)
- `GET /test/db/slime-assets/active`: List only active assets (is_active = true)

#### Quick Summary
- `GET /test/summary`: Database summary with counts of all entities

### Purpose
These test endpoints allow you to:
1. Verify Supabase connection is working
2. Check that all tables from task2.md SQL schema exist
3. Inspect data without needing a database GUI
4. Confirm the new `slime_assets` table is set up correctly
5. Debug configuration issues quickly

### Usage Example
After running the SQL schema from task2.md in Supabase:
1. Start backend: `python -m uvicorn python.main:app --reload`
2. Visit `http://localhost:8000/test/health/full` to verify everything
3. Visit `http://localhost:8000/test/summary` to see data counts
4. Visit `http://localhost:8000/docs` to see all test endpoints in Swagger UI

### Integration Notes
- Test router included in main.py
- Uses shared Supabase client from db.py
- All endpoints follow FastAPI HTTPException pattern for errors
- Informal comment style at top of file per CLAUDE.md rules
