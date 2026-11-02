"""Customer accounts: Emergent managed Google sign-in + Sign in with Apple, shared Bearer sessions."""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
APPLE_ISSUER = "https://appleid.apple.com"
APPLE_AUDIENCES = [a.strip() for a in os.environ["APPLE_AUDIENCES"].split(",") if a.strip()]
_apple_jwks = jwt.PyJWKClient("https://appleid.apple.com/auth/keys", cache_keys=True)
SESSION_DAYS = 7


class GoogleSessionBody(BaseModel):
    session_id: str = Field(min_length=4, max_length=512)


class AppleBody(BaseModel):
    identity_token: str = Field(min_length=20, max_length=4096)
    full_name: Optional[str] = Field(default=None, max_length=120)
    email: Optional[str] = Field(default=None, max_length=200)


def _public(user: dict) -> dict:
    return {k: user.get(k) for k in ("user_id", "email", "name", "picture", "provider")}


async def _new_session(db, user_id: str) -> str:
    token = f"st_{uuid.uuid4().hex}{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    await db.user_sessions.insert_one({
        "session_token": token, "user_id": user_id, "created_at": now, "expires_at": now + timedelta(days=SESSION_DAYS),
    })
    return token


async def get_current_user(db, request: Request, required: bool = True) -> Optional[dict]:
    auth = request.headers.get("authorization", "")
    token = auth[7:].strip() if auth.lower().startswith("bearer ") else ""
    if not token:
        if required:
            raise HTTPException(401, "Not authenticated")
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    expires = session and session["expires_at"]
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not session or expires < datetime.now(timezone.utc):
        if required:
            raise HTTPException(401, "Session expired")
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user and required:
        raise HTTPException(401, "User not found")
    return user


def build_router(db) -> APIRouter:
    r = APIRouter(prefix="/api/auth")

    @r.post("/session")
    async def google_session(body: GoogleSessionBody):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id})
        except httpx.HTTPError:
            raise HTTPException(502, "Sign-in service unavailable. Please try again.")
        if resp.status_code != 200:
            raise HTTPException(401, "Invalid or expired sign-in session")
        data = resp.json()
        email = (data.get("email") or "").lower()
        if not email:
            raise HTTPException(401, "No email returned")
        user = await db.users.find_one_and_update(
            {"email": email},
            {"$set": {"name": data.get("name"), "picture": data.get("picture"), "google": True},
             "$setOnInsert": {"user_id": f"user_{uuid.uuid4().hex[:12]}", "email": email, "provider": "google",
                              "created_at": datetime.now(timezone.utc)}},
            upsert=True, return_document=ReturnDocument.AFTER, projection={"_id": 0},
        )
        token = await _new_session(db, user["user_id"])
        return {"session_token": token, "user": _public(user)}

    @r.post("/apple")
    async def apple_sign_in(body: AppleBody):
        try:
            key = _apple_jwks.get_signing_key_from_jwt(body.identity_token)
            claims = jwt.decode(body.identity_token, key.key, algorithms=["RS256"], audience=APPLE_AUDIENCES, issuer=APPLE_ISSUER)
        except Exception:
            raise HTTPException(401, "Invalid Apple identity token")
        sub = claims["sub"]
        verified = str(claims.get("email_verified", "")).lower() == "true"
        token_email = (claims.get("email") or "").lower() if verified else None
        token_email = token_email or None
        user = await db.users.find_one({"apple_sub": sub}, {"_id": 0})
        if not user and token_email:
            # link to an existing Google account with the same email
            user = await db.users.find_one_and_update(
                {"email": token_email, "apple_sub": {"$exists": False}}, {"$set": {"apple_sub": sub}},
                return_document=ReturnDocument.AFTER, projection={"_id": 0},
            )
        if not user:
            doc = {"user_id": f"user_{uuid.uuid4().hex[:12]}", "apple_sub": sub, "provider": "apple",
                   "name": body.full_name, "created_at": datetime.now(timezone.utc)}
            if token_email:
                doc["email"] = token_email
            await db.users.insert_one(doc)
            user = {k: v for k, v in doc.items() if k != "_id"}
        else:
            upd = {}
            if body.full_name and not user.get("name"):
                upd["name"] = body.full_name
            if token_email and not user.get("email"):
                upd["email"] = token_email
            if upd:
                await db.users.update_one({"user_id": user["user_id"]}, {"$set": upd})
                user.update(upd)
        token = await _new_session(db, user["user_id"])
        return {"session_token": token, "user_id": user["user_id"], "user": _public(user)}

    @r.get("/me")
    async def me(request: Request):
        return _public(await get_current_user(db, request))

    @r.post("/logout")
    async def logout(request: Request):
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            await db.user_sessions.delete_one({"session_token": auth[7:].strip()})
        return {"ok": True}

    return r


async def ensure_auth_indexes(db) -> None:
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True, sparse=True)
    await db.users.create_index("apple_sub", unique=True, sparse=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
