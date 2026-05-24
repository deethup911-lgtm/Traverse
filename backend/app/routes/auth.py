from fastapi import APIRouter, HTTPException, Depends, status
from app.models import UserRegisterRequest, UserLoginRequest, serialize_doc
from app.database import users_col
from app.auth import generate_token, hash_password, verify_password
from app.middleware import get_current_user

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req_data: UserRegisterRequest):
    username = req_data.username.strip()
    password = req_data.password

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    existing_user = await users_col.find_one({"username": username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = hash_password(password)
    user_doc = {
        "username": username,
        "password_hash": hashed_pw,
        "email": None,
        "full_name": None,
        "preferences": {}
    }

    result = await users_col.insert_one(user_doc)
    created_id = str(result.inserted_id)

    return {
        "_id": created_id,
        "username": username,
        "token": generate_token(created_id)
    }

@router.post("/login")
async def login(req_data: UserLoginRequest):
    username = req_data.username.strip()
    password = req_data.password

    user = await users_col.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_id = str(user["_id"])
    return {
        "_id": user_id,
        "username": user["username"],
        "token": generate_token(user_id)
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_copy = dict(current_user)
    user_copy.pop("password_hash", None)
    return serialize_doc(user_copy)
