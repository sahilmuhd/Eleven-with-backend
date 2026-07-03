"""
Django settings for the ELEVEN backend.
Keep this simple to start — swap SQLite for Postgres and tighten
security settings before going to production (see README).
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ---- SECURITY -------------------------------------------------------------
# In production (Render) these come from environment variables you set in
# the Render dashboard. Locally, if you don't set them, these fallbacks let
# `runserver` keep working exactly as before.
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-CHANGE-ME-before-deploying')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Razorpay — set these as real environment variables (Render dashboard, or
# a local .env) once you have API keys. Left blank here on purpose: never
# hardcode secrets in settings.py. KEY_ID is not sensitive (it's sent to
# the browser to open the checkout widget); KEY_SECRET must stay server-side.
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

ALLOWED_HOSTS = []
# Render sets this automatically to your service's *.onrender.com hostname.
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
# Comma-separated list for your own domain(s), e.g. "api.yoursite.com".
ALLOWED_HOSTS += [h.strip() for h in os.environ.get('ALLOWED_HOSTS', '').split(',') if h.strip()]
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']  # local dev only — always set ALLOWED_HOSTS explicitly in production

# ---- APPS -------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    'shop',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # serves static files in production
    'corsheaders.middleware.CorsMiddleware',   # must be high in the list
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'eleven_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'eleven_backend.wsgi.application'

# ---- DATABASE -------------------------------------------------------------
# SQLite locally (zero setup). On Render, set the DATABASE_URL environment
# variable to your managed Postgres instance's "Internal Database URL" and
# this switches over automatically — no code change needed.
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---- MEDIA (product images) ------------------------------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ---- DJANGO REST FRAMEWORK -------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # read access is public; see views.py for write locks
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # lets staff use /admin/ + browsable API
    ],
}

# ---- CORS -------------------------------------------------------------
# Allow your frontend (static site) to call this API from the browser.
# Add your real domain via the CORS_ALLOWED_ORIGINS env var on Render,
# e.g. "https://eleven-frontend.onrender.com,https://sahilmuhd.com"
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
] + [o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()]
# While developing locally you can use this instead of the allowlist above:
# CORS_ALLOW_ALL_ORIGINS = True
