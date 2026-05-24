from fastapi import APIRouter, HTTPException, Depends
import json
from datetime import datetime
from bson import ObjectId
from app.models import ChatRequest, serialize_doc
from app.database import trips_col, chat_logs_col
from app.middleware import get_current_user
from app.utils.gemini import get_gemini_client

router = APIRouter()

@router.post("")
async def handle_chat(req_data: ChatRequest, current_user: dict = Depends(get_current_user)):
    query = req_data.query
    trip_id = req_data.trip_id
    user_id = current_user.get("_id")

    # Fetch current trip if provided
    trip = None
    if trip_id and not trip_id.startswith("guest_"):
        try:
            trip = await trips_col.find_one({"_id": ObjectId(trip_id)})
            # Verify user ownership of the trip
            if trip and trip.get("user_id") and str(trip.get("user_id")) != str(user_id):
                trip = None  # Unauthorized
        except Exception as err:
            print("Error fetching trip for chat:", err)
    elif req_data.tripData:
        trip = req_data.tripData

    # Determine if user wants a modification
    modification_keywords = ['add', 'remove', 'change', 'modify', 'itinerary', 'day', 'schedule', 'swap']
    is_modification_request = False
    if trip:
        query_lower = query.lower()
        is_modification_request = any(kw in query_lower for kw in modification_keywords)

    # Base Context
    context = "You are TRAVE, an intelligent AI travel assistant for India."
    if trip:
        context += f"\nCurrentUser Context: Planning a trip to {trip.get('destination')}. Itinerary: {json.dumps(trip.get('itinerary', {}))}"

    # Get recent logs only for logged-in users
    recent_logs = []
    if not current_user.get("isGuest") and user_id and ObjectId.is_valid(user_id):
        try:
            t_id = None
            if trip_id and not trip_id.startswith("guest_"):
                try:
                    t_id = ObjectId(trip_id)
                except Exception:
                    pass
            
            query_filter = {"user_id": ObjectId(user_id)}
            if t_id:
                query_filter["trip_id"] = t_id
            else:
                query_filter["trip_id"] = None
                
            cursor = chat_logs_col.find(query_filter).sort("createdAt", -1).limit(3)
            recent_logs = await cursor.to_list(length=3)
        except Exception as err:
            print("Error retrieving chat logs:", err)

    history_context = ""
    if recent_logs:
        recent_logs.reverse()
        history_lines = [f"U: {log.get('query')}\nA: {log.get('response')}" for log in recent_logs]
        history_context = "History:\n" + "\n".join(history_lines)

    if is_modification_request:
        final_prompt = f"""{context}
{history_context}

USER REQUEST: {query}

INSTRUCTION: The user wants to modify a specific part of their itinerary (e.g., a specific day or a global field).
YOU MUST return ONLY a JSON object with three fields:
1. "answer": A friendly confirmation message of what you changed.
2. "modified_day_plan": If a specific day was modified, return the single day JSON object following the EXACT structure of a day in 'daily_itinerary'. If no specific day was changed, set this to null.
3. "modified_top_level_fields": If global fields (like trip_title, destination_overview, etc) were changed, return them here. Otherwise, set to null.

By returning ONLY the changed parts, you save processing power. I will merge these changes back into the original itinerary.
DO NOT add any conversational text outside the JSON.
"""
    else:
        final_prompt = f"""{context}
{history_context}

User Question: {query}
Keep your answer friendly and concise.
"""

    client = get_gemini_client()
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=final_prompt
        )
        ai_answer = response.text or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot failed to generate response: {e}")

    updated_itinerary = None
    if is_modification_request:
        try:
            cleaned = ai_answer.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
            parsed = json.loads(cleaned)

            if parsed.get("modified_day_plan") or parsed.get("modified_top_level_fields"):
                # Get the existing itinerary and copy it
                new_itin = dict(trip.get("itinerary") or {"daily_itinerary": []})
                if "daily_itinerary" not in new_itin or not isinstance(new_itin["daily_itinerary"], list):
                    new_itin["daily_itinerary"] = []

                if parsed.get("modified_top_level_fields"):
                    top_fields = parsed["modified_top_level_fields"]
                    if isinstance(top_fields, dict):
                        for k, v in top_fields.items():
                            new_itin[k] = v

                day_plan = parsed.get("modified_day_plan")
                if day_plan and isinstance(day_plan, dict) and "day" in day_plan:
                    day_num = day_plan["day"]
                    daily_itin = new_itin["daily_itinerary"]
                    found_index = -1
                    for idx, d_obj in enumerate(daily_itin):
                        if d_obj.get("day") == day_num:
                            found_index = idx
                            break
                    if found_index != -1:
                        daily_itin[found_index] = day_plan
                    else:
                        daily_itin.append(day_plan)

                updated_itinerary = new_itin
                
                # If logged-in user, persist itinerary update
                if not current_user.get("isGuest") and trip_id and not trip_id.startswith("guest_"):
                    await trips_col.update_one(
                        {"_id": ObjectId(trip_id)},
                        {"$set": {"itinerary": updated_itinerary}}
                    )
                
                ai_answer = parsed.get("answer") or "I've updated your itinerary as requested! ✨"
        except Exception as err:
            print("Failed to parse modification JSON:", err)
            ai_answer = response.text or "I was unable to update your trip."

    # Save to Log only for logged-in users
    if not current_user.get("isGuest") and user_id and ObjectId.is_valid(user_id) and (not trip_id or not trip_id.startswith("guest_")):
        try:
            t_id = None
            if trip_id:
                try:
                    t_id = ObjectId(trip_id)
                except Exception:
                    pass

            log_doc = {
                "user_id": ObjectId(user_id),
                "trip_id": t_id,
                "query": query,
                "response": ai_answer,
                "createdAt": datetime.utcnow()
            }
            await chat_logs_col.insert_one(log_doc)
        except Exception as err:
            print("ChatLog creation failed:", err)

    return {"answer": ai_answer, "updated_itinerary": updated_itinerary}
