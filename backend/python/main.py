from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from python.routes.health import router as health_router
from python.routes.auth import router as auth_router
from python.routes.slime import router as slime_router
from python.routes.events import router as events_router
from python.routes.interaction import router as interaction_router
from python.routes.debug import router as debug_router

app = FastAPI(title="Slime Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # should be fine for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(slime_router)
app.include_router(events_router)
app.include_router(interaction_router)
app.include_router(debug_router)

