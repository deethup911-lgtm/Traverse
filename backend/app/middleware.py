from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from bson import ObjectId
from app.auth import verify_token
from app.database import users_col

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    guest_user = {
        "_id": "guest_user_id",
        "isGuest": True,
        "username": "Guest"
    }

    if not credentials:
        return guest_user

    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authorized, token failed")

    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authorized, invalid token payload")

    try:
        user = await users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Not authorized, invalid user ID format")

    if not user:
        raise HTTPException(status_code=401, detail="Not authorized, user not found")

    user["isGuest"] = False
    return user
