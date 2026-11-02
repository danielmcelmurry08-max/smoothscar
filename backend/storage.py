"""Emergent managed object storage (review photos)."""
import logging
import os

import requests

logger = logging.getLogger(__name__)

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("STORAGE_APP_NAME", "biorna-antiscar")
_storage_key = None


def init_storage() -> str:
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _with_retry(fn):
    global _storage_key
    try:
        return fn(init_storage())
    except requests.HTTPError as e:
        if e.response is not None and e.response.status_code == 503:
            _storage_key = None
            return fn(init_storage())
        raise


def put_object(path: str, data: bytes, content_type: str) -> dict:
    def call(key):
        r = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
        r.raise_for_status()
        return r.json()
    return _with_retry(call)


def get_object(path: str) -> tuple[bytes, str]:
    def call(key):
        r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
        r.raise_for_status()
        return r.content, r.headers.get("Content-Type", "application/octet-stream")
    return _with_retry(call)
