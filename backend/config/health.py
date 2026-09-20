from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection


def health_check(request):
    """
    Returns {"status": "ok"} plus individual component statuses.
    Always returns 200 so load-balancers don't drop the container;
    individual component failures are visible in the body.
    """
    db_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        pass

    redis_ok = False
    try:
        cache.set("health_ping", "pong", timeout=5)
        redis_ok = cache.get("health_ping") == "pong"
    except Exception:
        pass

    return JsonResponse(
        {
            "status": "ok" if (db_ok and redis_ok) else "degraded",
            "components": {
                "database": "ok" if db_ok else "error",
                "redis": "ok" if redis_ok else "error",
            },
        }
    )
