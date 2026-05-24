from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

# --- Serialization Helpers ---
def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if doc is None:
        return None
    res = dict(doc)
    if "_id" in res:
        res["_id"] = str(res["_id"])
    for k, v in res.items():
        if isinstance(v, ObjectId):
            res[k] = str(v)
        elif isinstance(v, datetime):
            # Convert datetime to ISO string
            res[k] = v.isoformat()
    return res

def serialize_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [serialize_doc(d) for d in docs if d is not None]

# --- Request Schemas ---
class UserRegisterRequest(BaseModel):
    username: str
    password: str

class UserLoginRequest(BaseModel):
    username: str
    password: str

class TripCreateRequest(BaseModel):
    starting_point: str
    destination: str
    days: Optional[Any] = 3  # can be string or int from frontend
    travel_mode: str
    interests: Optional[List[str]] = []
    trip_pace: Optional[str] = ""
    accessibility: Optional[str] = ""
    stay_style: Optional[str] = ""
    local_transit: Optional[str] = ""
    budget_range: Optional[str] = ""
    places_to_cover: Optional[str] = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    trip_companions: Optional[str] = ""
    family_adults: Optional[Any] = 2
    family_kids: Optional[Any] = 0
    gender: Optional[str] = None

class TripUpdateRequest(BaseModel):
    review: Optional[str] = None
    rating: Optional[int] = None
    status: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    trip_id: Optional[str] = None
    tripData: Optional[Dict[str, Any]] = None
