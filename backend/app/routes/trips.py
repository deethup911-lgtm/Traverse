from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models import TripCreateRequest, TripUpdateRequest, serialize_doc, serialize_list
from app.database import trips_col, budgets_col
from app.middleware import get_current_user
from app.utils.gemini import generate_trip_itinerary

router = APIRouter()

def format_inr(number):
    s = str(int(number))
    if len(s) <= 3:
        return s
    last_three = s[-3:]
    remaining = s[:-3]
    out = []
    while len(remaining) > 2:
        out.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        out.insert(0, remaining)
    return ",".join(out) + "," + last_three

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_trip(req: TripCreateRequest, current_user: dict = Depends(get_current_user)):
    try:
        days_count = int(req.days) if req.days is not None else 3
    except (ValueError, TypeError):
        days_count = 3

    try:
        budget = int(req.budget_range) if req.budget_range else 0
    except (ValueError, TypeError):
        budget = 0

    # --- VALIDATION AND SUGGESTIONS ---
    suggestions = []

    # 1. Extreme Budget Validation
    if budget < 500:
        if budget <= 10:
            suggestions.append(f"A budget of ₹{budget} is not possible for travel. It won't even cover a single local transit fare. Please plan with at least ₹500 for a local day trip.")
        else:
            suggestions.append(f"A budget of ₹{budget} is extremely low for a trip. Consider increasing it to at least ₹2000 per day for a basic experience.")
    elif budget < 2000 and req.destination.lower() != req.starting_point.lower():
        suggestions.append(f"For travel from {req.starting_point} to {req.destination}, a budget of ₹{budget} might be insufficient for travel and stay. Suggesting budget-friendly options!")

    # 2. Unrealistic Duration/Destination Validation
    locations_count = req.destination.count(",") + 1
    if locations_count > 1 and days_count < 2:
        suggestions.append(f"Visiting {locations_count} distinct locations in just {days_count} day is highly unrealistic. We suggest planning at least 2 days per major city.")

    if suggestions:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Impossible Trip Parameters",
                "suggestions": suggestions,
                "severity": "warning"
            }
        )

    # --- GENERATE ITINERARY ---
    trip_params = {
        "starting_point": req.starting_point,
        "destination": req.destination,
        "days": days_count,
        "travel_mode": req.travel_mode,
        "interests": req.interests or [],
        "trip_pace": req.trip_pace,
        "accessibility": req.accessibility,
        "stay_style": req.stay_style,
        "local_transit": req.local_transit,
        "budget_range": str(budget),
        "places_to_cover": req.places_to_cover,
        "trip_companions": req.trip_companions,
        "family_adults": int(req.family_adults) if req.family_adults is not None else 2,
        "family_kids": int(req.family_kids) if req.family_kids is not None else 0,
        "gender": req.gender
    }

    itinerary_data = await generate_trip_itinerary(trip_params)

    if itinerary_data.get("is_impossible"):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Impossible Trip Parameters",
                "suggestions": [itinerary_data.get("impossible_reason", "This trip is not physically possible within the given timeframe.")],
                "severity": "warning"
            }
        )

    # Budget safety net
    def calc_total(costs):
        return (costs.get("accommodation") or 0) + (costs.get("food") or 0) + \
               (costs.get("transport") or 0) + (costs.get("activities") or 0)

    budget_warning = None
    if budget > 0 and itinerary_data.get("estimated_costs_inr"):
        generated_total = calc_total(itinerary_data["estimated_costs_inr"])
        if generated_total > budget:
            print(f"Budget exceeded: generated ₹{generated_total} vs limit ₹{budget}. Retrying with strict mode...")
            trip_params["strict_budget"] = True
            itinerary_data = await generate_trip_itinerary(trip_params)
            retried_total = calc_total(itinerary_data.get("estimated_costs_inr", {}))
            if retried_total > budget:
                budget_warning = f"Note: The AI estimated ₹{format_inr(retried_total)} for this trip, which is slightly above your ₹{format_inr(budget)} budget. Consider using cheaper transit or accommodation options."

    # Handle Guest User
    if current_user.get("isGuest"):
        # Create virtual trip dict and return
        import time
        guest_trip_id = f"guest_{int(time.time() * 1000)}"
        return {
            "_id": guest_trip_id,
            "isGuest": True,
            "starting_point": req.starting_point,
            "destination": req.destination,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "days_count": days_count,
            "travel_mode": req.travel_mode,
            "interests": req.interests or [],
            "trip_pace": req.trip_pace,
            "accessibility": req.accessibility,
            "stay_style": req.stay_style,
            "local_transit": req.local_transit,
            "places_to_cover": req.places_to_cover,
            "trip_companions": req.trip_companions,
            "family_adults": req.family_adults,
            "family_kids": req.family_kids,
            "gender": req.gender,
            "status": "planned",
            "itinerary": itinerary_data,
            "budget_warning": budget_warning
        }

    # Save to MongoDB for logged in users
    trip_doc = {
        "user_id": ObjectId(current_user["_id"]),
        "starting_point": req.starting_point,
        "destination": req.destination,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "days_count": days_count,
        "travel_mode": req.travel_mode,
        "interests": req.interests or [],
        "trip_pace": req.trip_pace,
        "accessibility": req.accessibility,
        "stay_style": req.stay_style,
        "local_transit": req.local_transit,
        "places_to_cover": req.places_to_cover,
        "trip_companions": req.trip_companions,
        "family_adults": int(req.family_adults) if req.family_adults is not None else 2,
        "family_kids": int(req.family_kids) if req.family_kids is not None else 0,
        "gender": req.gender,
        "status": "planned",
        "itinerary": itinerary_data,
        "budget_warning": budget_warning,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    result = await trips_col.insert_one(trip_doc)
    trip_doc["_id"] = result.inserted_id

    # Create Budget Document
    estimated = itinerary_data.get("estimated_costs_inr") or {
        "accommodation": 0, "food": 0, "transport": 0, "activities": 0
    }
    accommodation = int(estimated.get("accommodation") or 0)
    food = int(estimated.get("food") or 0)
    transport = int(estimated.get("transport") or 0)
    activities = int(estimated.get("activities") or 0)
    total_budget_est = accommodation + food + transport + activities

    budget_doc = {
        "trip_id": result.inserted_id,
        "total_budget": total_budget_est,
        "categories": {
            "accommodation": accommodation,
            "food": food,
            "transport": transport,
            "entry_fees": activities,
            "miscellaneous": int(total_budget_est * 0.1)
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    await budgets_col.insert_one(budget_doc)

    return serialize_doc(trip_doc)

@router.get("")
async def get_user_trips(current_user: dict = Depends(get_current_user)):
    if current_user.get("isGuest"):
        raise HTTPException(status_code=401, detail="Guest users have no saved trips")

    cursor = trips_col.find({"user_id": ObjectId(current_user["_id"])}).sort("createdAt", -1)
    trips = await cursor.to_list(length=100)
    return serialize_list(trips)

@router.get("/{trip_id}")
async def get_trip_by_id(trip_id: str):
    try:
        trip = await trips_col.find_one({"_id": ObjectId(trip_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return serialize_doc(trip)

@router.put("/{trip_id}")
async def update_trip(trip_id: str, req_data: TripUpdateRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("isGuest"):
        raise HTTPException(status_code=401, detail="Guest users cannot update saved trips")

    try:
        trip = await trips_col.find_one({"_id": ObjectId(trip_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if str(trip.get("user_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=401, detail="Not authorized")

    update_fields = {}
    if req_data.review is not None:
        update_fields["review"] = req_data.review
    if req_data.rating is not None:
        update_fields["rating"] = req_data.rating
    if req_data.status is not None:
        update_fields["status"] = req_data.status

    if update_fields:
        update_fields["updatedAt"] = datetime.utcnow()
        await trips_col.update_one({"_id": ObjectId(trip_id)}, {"$set": update_fields})
        trip = await trips_col.find_one({"_id": ObjectId(trip_id)})

    return serialize_doc(trip)
