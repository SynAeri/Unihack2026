# Task 2 — Storage + Assets + Updated Schema for Slime Companion

## Goal

Set up **Supabase Storage** and the related **database schema** so we can:

* store generated or uploaded slime assets in the `slime-assets` bucket
* track which user and slime each asset belongs to
* support multiple assets per slime
* support active/inactive assets
* keep the backend API clean for future upload/download flows

This task updates the current schema slightly so the asset system fits the rest of the backend cleanly.

---

## Storage bucket

Use this existing bucket name:

```text
slime-assets
```

Recommended storage path convention:

```text
users/<user_id>/slimes/<slime_id>/model.fbx
users/<user_id>/slimes/<slime_id>/albedo.png
users/<user_id>/slimes/<slime_id>/normal.png
users/<user_id>/slimes/<slime_id>/preview.webp
```

This gives us:

* clean ownership by user
* clean grouping by slime
* support for multiple file types per slime

---

## Why DB + Storage both exist

### Storage bucket stores

Actual files:

* `.fbx`
* `.png`
* `.jpg`
* `.webp`
* optional `.json`

### Database stores

Metadata and relationships:

* which user owns the asset
* which slime it belongs to
* what kind of asset it is
* where it lives in storage
* whether it is active
* timestamps

Do **not** rely only on bucket paths for logic.
Use a table for lookup and ownership.

---

## Updated database schema

### Notes on changes

Compared to the earlier draft:

* `personality` should be `jsonb`, not plain text/dict-like only
* `slime_assets` now includes `slime_id`
* added `mime_type`
* added `file_name`
* added `asset_role` for model/texture distinction
* added `updated_at` where useful
* kept schema light enough for hackathon speed

---

## SQL script to run in Supabase

Run this in **Supabase SQL Editor**.

```sql
create extension if not exists pgcrypto;

-- USERS ------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamptz not null default now()
);

-- SLIMES -----------------------------------------------------------
create table if not exists slimes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  slime_type text not null,
  personality jsonb not null default '{}'::jsonb,
  bond_level int not null default 0,
  state text not null default 'idle',
  dominant_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- JOURNEYS ---------------------------------------------------------
create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  slime_id uuid not null references slimes(id) on delete cascade,
  start_lat double precision not null,
  start_lng double precision not null,
  dest_lat double precision not null,
  dest_lng double precision not null,
  progress double precision not null default 0,
  status text not null default 'active',
  place_name text,
  place_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EVENTS -----------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slime_id uuid not null references slimes(id) on delete cascade,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- SLIME ASSETS -----------------------------------------------------
create table if not exists slime_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  slime_id uuid not null references slimes(id) on delete cascade,
  asset_type text not null,
  asset_role text,
  bucket_name text not null default 'slime-assets',
  storage_path text not null,
  file_name text,
  mime_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OPTIONAL INDEXES -------------------------------------------------
create index if not exists idx_slimes_user_id on slimes(user_id);
create index if not exists idx_journeys_slime_id on journeys(slime_id);
create index if not exists idx_events_slime_id on events(slime_id);
create index if not exists idx_slime_assets_user_id on slime_assets(user_id);
create index if not exists idx_slime_assets_slime_id on slime_assets(slime_id);
create index if not exists idx_slime_assets_bucket_path on slime_assets(bucket_name, storage_path);

-- OPTIONAL: updated_at helper -------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- attach trigger to tables that have updated_at

drop trigger if exists trg_slimes_updated_at on slimes;
create trigger trg_slimes_updated_at
before update on slimes
for each row
execute function set_updated_at();

drop trigger if exists trg_journeys_updated_at on journeys;
create trigger trg_journeys_updated_at
before update on journeys
for each row
execute function set_updated_at();

drop trigger if exists trg_slime_assets_updated_at on slime_assets;
create trigger trg_slime_assets_updated_at
before update on slime_assets
for each row
execute function set_updated_at();
```

---

## Optional seed data for quick testing

Run this after the main schema if needed:

```sql
insert into users (username)
values ('demo_user')
on conflict (username) do nothing;

insert into slimes (user_id, slime_type, personality, bond_level, state, dominant_color)
select
  u.id,
  'book',
  '{"temperament":"quiet","interest":"study","preferred_places":["library","quiet cafe"]}'::jsonb,
  0,
  'idle',
  '#6A7BA2'
from users u
where u.username = 'demo_user'
and not exists (
  select 1 from slimes s where s.user_id = u.id
);
```

---

## Expected upload flow

### Create slime with asset

1. frontend sends request to backend
2. backend creates slime row in `slimes`
3. backend uploads asset to `slime-assets`
4. backend inserts metadata row into `slime_assets`
5. backend returns slime + asset metadata

### Add more assets later

Examples:

* upload a texture for an existing slime
* upload a preview image
* upload a new version of a model

In that case:

1. frontend calls upload endpoint for existing slime
2. backend uploads file to bucket
3. backend writes new `slime_assets` row
4. backend can mark previous matching asset as inactive if needed

---

## Asset roles to use

Suggested values:

### `asset_type`

* `model`
* `texture`
* `preview`
* `template`

### `asset_role`

* `fbx`
* `albedo`
* `normal`
* `roughness`
* `preview`
* `thumbnail`

This lets us ask questions like:

* what is the active model for this slime?
* what is the active albedo texture for this slime?

---

## Example asset metadata row

```json
{
  "user_id": "<user_uuid>",
  "slime_id": "<slime_uuid>",
  "asset_type": "model",
  "asset_role": "fbx",
  "bucket_name": "slime-assets",
  "storage_path": "users/<user_uuid>/slimes/<slime_uuid>/model.fbx",
  "file_name": "model.fbx",
  "mime_type": "application/octet-stream",
  "is_active": true
}
```

---

## Updated Pydantic schemas

These are aligned with the updated SQL schema.

```python
# Pydantic schemas for request/response models
# Defines the data structures for the Slime Companion API

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Auth schemas
class LoginRequest(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: str

# Slime schemas
class PersonalityData(BaseModel):
    temperament: str
    interest: str
    preferred_places: List[str]

class InterpretImageRequest(BaseModel):
    user_id: str
    object_class: str
    dominant_color: str
    labels: List[str]

class SlimeResponse(BaseModel):
    id: str
    user_id: str
    slime_type: str
    personality: Dict[str, Any]
    bond_level: int
    state: str
    dominant_color: Optional[str] = None
    created_at: str

class InterpretImageResponse(BaseModel):
    slime: SlimeResponse
    personality: PersonalityData

class SetStateRequest(BaseModel):
    state: str

# Journey schemas
class StartJourneyRequest(BaseModel):
    user_id: str
    current_lat: float
    current_lng: float

class DestinationData(BaseModel):
    name: str
    lat: float
    lng: float
    reason: str

class JourneyResponse(BaseModel):
    id: str
    slime_id: str
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float
    progress: float
    status: str
    place_name: Optional[str] = None
    place_reason: Optional[str] = None
    created_at: str

class StartJourneyResponse(BaseModel):
    journey: JourneyResponse
    destination: DestinationData

class JourneyProgressRequest(BaseModel):
    progress: float

# Event schemas
class EventResponse(BaseModel):
    id: str
    slime_id: str
    event_type: str
    message: str
    created_at: str

class CreateEventRequest(BaseModel):
    slime_id: str
    event_type: str
    message: str

# Interaction schemas
class FeedSlimeRequest(BaseModel):
    food_class: str
    labels: List[str]

class FeedSlimeResponse(BaseModel):
    success: bool
    bond_delta: int
    bond_level: int
    message: str

# Debug schemas
class DebugSeedSlimeRequest(BaseModel):
    user_id: str
    object_class: Optional[str] = "book"
    dominant_color: Optional[str] = "#6A7BA2"

class DebugSetStateRequest(BaseModel):
    slime_id: str
    state: str

# Storage / asset schemas
class SlimeAssetResponse(BaseModel):
    id: str
    user_id: str
    slime_id: str
    asset_type: str
    asset_role: Optional[str] = None
    bucket_name: str
    storage_path: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    is_active: bool
    created_at: str
```

---

## Backend task list

### 1. Supabase setup

* create or confirm bucket exists: `slime-assets`
* run the SQL schema above
* add at least one test user and one test slime if useful

### 2. Backend storage support

Implement endpoints for:

* create slime and upload asset
* upload asset for existing slime
* get all assets for a slime
* optionally deactivate prior active asset of same role

### 3. Recommended endpoint behavior

#### `POST /slimes/create-with-asset`

Should:

* validate user exists
* create slime row
* upload file to bucket path
* insert `slime_assets` row
* return slime + asset metadata

#### `POST /slimes/{slime_id}/assets/upload`

Should:

* validate slime exists and belongs to user
* upload file to bucket
* insert `slime_assets` row
* optionally mark old active asset as inactive

#### `GET /slimes/{slime_id}/assets`

Should:

* fetch all asset metadata rows
* return storage paths
* optionally attach public or signed URL

---

## Practical notes

### Public vs private bucket

For hackathon speed:

* public bucket is easier
* private bucket is safer

If using a public bucket:

* backend can return public URLs directly

If using a private bucket:

* backend should generate signed URLs

### FBX note

Storage is fine with `.fbx`.
Rendering support is a frontend/AR problem, not a storage problem.

### Repo note

* SQL schema belongs in the repo
* bucket file contents do not magically sync from repo
* uploads must happen via backend or frontend code

---

## Suggested next steps

1. run the SQL schema in Supabase
2. create/confirm the `slime-assets` bucket
3. implement backend upload endpoint
4. test with one image upload first
5. then test `.fbx` upload
6. then connect Expo to retrieve the returned asset metadata

```
```

