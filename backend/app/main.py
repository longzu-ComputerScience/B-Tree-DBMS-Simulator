"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router, db
from . import storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load persisted state on startup
    loaded = storage.load_state(db)
    if loaded:
        print("[startup] Loaded persisted state from disk")
    else:
        print("[startup] No persisted state found, starting fresh")
    yield
    # Save state on shutdown
    storage.save_state(db.base_table, db.id_index, db.name_index, db.history)
    print("[shutdown] State saved on shutdown")


app = FastAPI(
    title="B-Tree DBMS Simulation",
    description="A student-record database simulation with B-Tree indexing",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://btree-dbms.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
