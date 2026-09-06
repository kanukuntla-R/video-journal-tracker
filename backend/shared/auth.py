from typing import Optional

import jwt
from fastapi import Header, HTTPException

from backend.shared.settings import AUTH_REQUIRED, SUPABASE_JWT_SECRET

DEV_USER_ID = "anonymous"


def get_auth_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization:
        if AUTH_REQUIRED:
            raise HTTPException(status_code=401, detail="Authentication required")
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    if not SUPABASE_JWT_SECRET:
        if AUTH_REQUIRED:
            raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET is not configured")
        return None

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token is missing subject")
    return str(user_id)


def resolve_user_id(requested_user_id: Optional[str], auth_user_id: Optional[str]) -> str:
    if auth_user_id:
        if requested_user_id and requested_user_id not in {DEV_USER_ID, auth_user_id}:
            raise HTTPException(status_code=403, detail="Cannot access another user's data")
        return auth_user_id

    if AUTH_REQUIRED:
        raise HTTPException(status_code=401, detail="Authentication required")

    return requested_user_id or DEV_USER_ID


def ensure_can_access_user(resource_user_id: str, auth_user_id: Optional[str]) -> None:
    if auth_user_id and resource_user_id != auth_user_id:
        raise HTTPException(status_code=404, detail="Journal not found")
    if AUTH_REQUIRED and not auth_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
