# Test manual endpoints for verifying database and configuration
# Provides endpoints to check Supabase connectivity, tables, and general setup
# Connects to: Supabase (all tables), config validation

from fastapi import APIRouter, HTTPException
from python.db import supabase
from typing import Dict, Any, List

router = APIRouter(prefix="/test", tags=["testing"])

# ======================================================
# Database Connectivity Tests
# ======================================================

@router.get("/db/health")
async def test_database_health() -> Dict[str, Any]:
    """
    Test basic Supabase database connectivity
    Returns status of database connection
    """
    try:
        # Simple query to check connection
        result = supabase.table("users").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "message": "Database connection successful",
            "can_query": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

# ======================================================
# Table Existence Tests
# ======================================================

@router.get("/db/tables")
async def test_all_tables() -> Dict[str, Any]:
    """
    Test that all required tables exist and are accessible
    Checks: users, slimes, journeys, events, slime_assets
    """
    tables_status = {}
    tables = ["users", "slimes", "journeys", "events", "slime_assets"]

    for table in tables:
        try:
            result = supabase.table(table).select("*").limit(1).execute()
            tables_status[table] = {
                "exists": True,
                "accessible": True,
                "error": None
            }
        except Exception as e:
            tables_status[table] = {
                "exists": False,
                "accessible": False,
                "error": str(e)
            }

    all_good = all(status["accessible"] for status in tables_status.values())

    return {
        "all_tables_ready": all_good,
        "tables": tables_status
    }

# ======================================================
# Users Table Tests
# ======================================================

@router.get("/db/users/count")
async def test_users_count() -> Dict[str, Any]:
    """
    Get count of users in database
    Useful for checking if seed data exists
    """
    try:
        result = supabase.table("users").select("id", count="exact").execute()
        return {
            "table": "users",
            "count": result.count,
            "message": "Users table query successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to count users: {str(e)}"
        )

@router.get("/db/users/all")
async def test_users_list() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all users (limited to 50)
    Useful for checking test data
    """
    try:
        result = supabase.table("users").select("*").limit(50).execute()
        return {
            "users": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )

# ======================================================
# Slimes Table Tests
# ======================================================

@router.get("/db/slimes/count")
async def test_slimes_count() -> Dict[str, Any]:
    """
    Get count of slimes in database
    """
    try:
        result = supabase.table("slimes").select("id", count="exact").execute()
        return {
            "table": "slimes",
            "count": result.count,
            "message": "Slimes table query successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to count slimes: {str(e)}"
        )

@router.get("/db/slimes/all")
async def test_slimes_list() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all slimes (limited to 50)
    Shows slime_type, bond_level, state, user_id
    """
    try:
        result = supabase.table("slimes").select("*").limit(50).execute()
        return {
            "slimes": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch slimes: {str(e)}"
        )

# ======================================================
# Events Table Tests
# ======================================================

@router.get("/db/events/count")
async def test_events_count() -> Dict[str, Any]:
    """
    Get count of events in database
    """
    try:
        result = supabase.table("events").select("id", count="exact").execute()
        return {
            "table": "events",
            "count": result.count,
            "message": "Events table query successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to count events: {str(e)}"
        )

@router.get("/db/events/recent")
async def test_events_recent() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get most recent 20 events
    Ordered by created_at descending
    """
    try:
        result = supabase.table("events").select("*").order("created_at", desc=True).limit(20).execute()
        return {
            "events": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch events: {str(e)}"
        )

# ======================================================
# Journeys Table Tests
# ======================================================

@router.get("/db/journeys/count")
async def test_journeys_count() -> Dict[str, Any]:
    """
    Get count of journeys in database
    """
    try:
        result = supabase.table("journeys").select("id", count="exact").execute()
        return {
            "table": "journeys",
            "count": result.count,
            "message": "Journeys table query successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to count journeys: {str(e)}"
        )

@router.get("/db/journeys/all")
async def test_journeys_list() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all journeys (limited to 50)
    """
    try:
        result = supabase.table("journeys").select("*").limit(50).execute()
        return {
            "journeys": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch journeys: {str(e)}"
        )

# ======================================================
# Slime Assets Table Tests (NEW from task2)
# ======================================================

@router.get("/db/slime-assets/count")
async def test_slime_assets_count() -> Dict[str, Any]:
    """
    Get count of slime assets in database
    """
    try:
        result = supabase.table("slime_assets").select("id", count="exact").execute()
        return {
            "table": "slime_assets",
            "count": result.count,
            "message": "Slime assets table query successful"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to count slime assets: {str(e)}"
        )

@router.get("/db/slime-assets/all")
async def test_slime_assets_list() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all slime assets (limited to 50)
    Shows storage paths, asset types, and metadata
    """
    try:
        result = supabase.table("slime_assets").select("*").limit(50).execute()
        return {
            "assets": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch slime assets: {str(e)}"
        )

@router.get("/db/slime-assets/active")
async def test_slime_assets_active() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get only active slime assets
    Filters by is_active = true
    """
    try:
        result = supabase.table("slime_assets").select("*").eq("is_active", True).limit(50).execute()
        return {
            "active_assets": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch active slime assets: {str(e)}"
        )

# ======================================================
# Configuration Tests
# ======================================================

@router.get("/config/check")
async def test_configuration() -> Dict[str, Any]:
    """
    Check that environment configuration is loaded correctly
    Does not expose sensitive values
    """
    from python.config import Project_URL, Secret_key

    return {
        "supabase_url_configured": bool(Project_URL and len(Project_URL) > 0),
        "supabase_key_configured": bool(Secret_key and len(Secret_key) > 0),
        "message": "Configuration check complete"
    }

# ======================================================
# Combined Health Check
# ======================================================

@router.get("/health/full")
async def test_full_health() -> Dict[str, Any]:
    """
    Comprehensive health check
    Tests database, tables, and configuration
    """
    health_report = {
        "database_connected": False,
        "tables_ready": False,
        "config_loaded": False,
        "errors": []
    }

    # Test database connection
    try:
        supabase.table("users").select("id").limit(1).execute()
        health_report["database_connected"] = True
    except Exception as e:
        health_report["errors"].append(f"Database: {str(e)}")

    # Test all tables
    try:
        tables = ["users", "slimes", "journeys", "events", "slime_assets"]
        for table in tables:
            supabase.table(table).select("*").limit(1).execute()
        health_report["tables_ready"] = True
    except Exception as e:
        health_report["errors"].append(f"Tables: {str(e)}")

    # Test config
    try:
        from python.config import Project_URL, Secret_key
        if Project_URL and Secret_key:
            health_report["config_loaded"] = True
        else:
            health_report["errors"].append("Config: Missing values")
    except Exception as e:
        health_report["errors"].append(f"Config: {str(e)}")

    health_report["overall_status"] = "healthy" if all([
        health_report["database_connected"],
        health_report["tables_ready"],
        health_report["config_loaded"]
    ]) else "unhealthy"

    return health_report

# ======================================================
# Quick Summary Endpoint
# ======================================================

@router.get("/summary")
async def test_summary() -> Dict[str, Any]:
    """
    Quick summary of database state
    Shows counts of all main entities
    """
    try:
        users_count = supabase.table("users").select("id", count="exact").execute().count
        slimes_count = supabase.table("slimes").select("id", count="exact").execute().count
        events_count = supabase.table("events").select("id", count="exact").execute().count
        journeys_count = supabase.table("journeys").select("id", count="exact").execute().count
        assets_count = supabase.table("slime_assets").select("id", count="exact").execute().count

        return {
            "database_summary": {
                "users": users_count,
                "slimes": slimes_count,
                "events": events_count,
                "journeys": journeys_count,
                "slime_assets": assets_count
            },
            "status": "operational"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )
