"""
Base Django settings for SchemeNavigator backend.
All environment-specific settings live in dev.py / prod.py.
"""
import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "api.env")
load_dotenv(BASE_DIR / "api.env.local", override=True)
if BASE_DIR.parent:
    load_dotenv(BASE_DIR.parent / ".env")
    load_dotenv(BASE_DIR.parent / "api.env")
    load_dotenv(BASE_DIR.parent / "api.env.local", override=True)

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-change-me-in-production-please",
)
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver,*").split(",")

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
]

LOCAL_APPS = [
    "schemes",
    "sessions_app",
    "tracker",
    "assistant",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
_raw_db = os.environ.get("DATABASE_URL", "sqlite:///db.sqlite3")
if _raw_db.startswith("sqlite:///"):
    _sqlite_file = _raw_db.replace("sqlite:///", "")
    if not os.path.isabs(_sqlite_file):
        _sqlite_file = str((BASE_DIR / _sqlite_file).resolve())
    _db_url = f"sqlite:///{_sqlite_file}"
else:
    _db_url = _raw_db

DATABASES = {
    "default": dj_database_url.config(
        default=_db_url,
        conn_max_age=60,
        conn_health_checks=True,
    )
}

# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------
# Use instant in-memory cache for local dev / default; Redis if USE_REDIS=true
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
USE_REDIS = os.environ.get("USE_REDIS", "false").lower() == "true"

if USE_REDIS:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
            },
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "scheme-navigator-fast-cache",
        }
    }


# ---------------------------------------------------------------------------
# Static files
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ---------------------------------------------------------------------------
# Default auto field
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# DRF
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "sessions_app.authentication.SessionTokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-session-token",
]

# ---------------------------------------------------------------------------
# LiteLLM / Agents / Gemini
# ---------------------------------------------------------------------------
_raw_key = (
    os.environ.get("GEMINI_API_KEY", "")
    or os.environ.get("GOOGLE_API_KEY", "")
    or os.environ.get("LITELLM_API_KEY", "")
).strip()
if any(dummy in _raw_key for dummy in ["your-key-here", "placeholder", "..."]):
    _raw_key = ""

LITELLM_API_KEY = _raw_key
LITELLM_MODEL = os.environ.get("LITELLM_MODEL", "gemini/gemini-2.5-flash").strip()
LITELLM_MAX_TOKENS = int(os.environ.get("LITELLM_MAX_TOKENS", "1200"))

# ---------------------------------------------------------------------------
# Government Scheme API Integration
# ---------------------------------------------------------------------------
GOVT_SCHEME_API_URL = os.environ.get("GOVT_SCHEME_API_URL", "")
GOVT_SCHEME_API_KEY = os.environ.get("GOVT_SCHEME_API_KEY", "")

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
