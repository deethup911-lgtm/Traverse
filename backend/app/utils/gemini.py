import os
import time
import json
from google import genai
from app.config import settings

def get_gemini_client():
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    return genai.Client(api_key=api_key)

async def generate_trip_itinerary(params: dict) -> dict:
    starting_point = params.get("starting_point")
    destination = params.get("destination")
    days = params.get("days", 3)
    travel_mode = params.get("travel_mode")
    interests = params.get("interests", [])
    trip_pace = params.get("trip_pace", "")
    accessibility = params.get("accessibility", "")
    stay_style = params.get("stay_style", "")
    local_transit = params.get("local_transit", "")
    budget_range = params.get("budget_range", "")
    places_to_cover = params.get("places_to_cover", "")
    trip_companions = params.get("trip_companions", "")
    family_adults = params.get("family_adults", 2)
    family_kids = params.get("family_kids", 0)
    gender = params.get("gender")
    strict_budget = params.get("strict_budget", False)

    companions_description = trip_companions or 'Couple'
    if trip_companions == 'Family':
        try:
            adults = int(family_adults) if family_adults is not None else 2
        except (ValueError, TypeError):
            adults = 2
        try:
            kids = int(family_kids) if family_kids is not None else 0
        except (ValueError, TypeError):
            kids = 0
        
        adults_str = f"{adults} Adult{'s' if adults != 1 else ''}"
        kids_str = f", {kids} Kid{'s' if kids != 1 else ''} under 12" if kids > 0 else ""
        companions_description = f"Family ({adults_str}{kids_str})"

    try:
        budget = int(budget_range) if budget_range else 0
    except (ValueError, TypeError):
        budget = 0

    interests_str = ", ".join(interests) if isinstance(interests, list) else str(interests)

    solo_planning = ""
    if trip_companions == 'Solo':
        if gender == 'Female':
            solo_planning = "SOLO FEMALE TRAVELER PLANNING: The user is a solo female traveler. All stays (hotels, hostels, homestays) MUST prioritize high safety ratings, 24/7 security, and suggest female-only dorms if hostels are chosen. Safety tips and well-lit, popular activity zones should be prioritized."
        elif gender == 'Male':
            solo_planning = "SOLO MALE TRAVELER PLANNING: The user is a solo male traveler. Suggest social lodging options (like highly-rated hostelling chains or social homestays) and highlight local social events/hubs."
        else:
            solo_planning = "SOLO TRAVELER PLANNING: The user is a solo traveler. Stays and activities should be tailored for a single individual, emphasizing safety, cost efficiency, and social interaction."

    prompt = f"""
    You are an expert global travel planner focusing on Indian and international destinations.
    Create a strictly {days}-day itinerary going from {starting_point} to {destination}. The itinerary MUST span exactly {days} days, no more, no less.
    Mode of travel to destination: {travel_mode}. Trip Companions: {companions_description}. Interests: {interests_str}. Trip Pace: {trip_pace}. Accessibility Needs: {accessibility}. Preferred Stay Style: {stay_style}. Local Transit Mode: {local_transit}.
    Places the user specifically wants to cover: {places_to_cover or "None specified, use best judgment"}.

    CRITICAL FEASIBILITY CHECK: Only if taking a {days}-day trip from {starting_point} to {destination} is EXTREMELY physically impossible (e.g. 1 day across the globe where flights alone take 24+ hours), return EXACTLY: {{ "is_impossible": true, "impossible_reason": "Provide short explanation" }}. If it is even slightly possible (e.g. New York to Boston in 3 days, or even 1 day), DO NOT return is_impossible. Proceed normally.

    CRITICAL ITINERARY FLOW: Day 1 MUST explicitly feature the journey of leaving {starting_point} and arriving at {destination}. Only after arriving at {destination} should the itinerary explore local sights. Ensure all specific places requested by the user ("{places_to_cover or "N/A"}") are comprehensively woven into the daily schedules. Include distinct food breaks and specific restaurant names with approximate INR pricing in the activities sequence.

    {"FAMILY PLANNING: You are planning for " + companions_description + ". All stays MUST be family-friendly with rooms suitable for the full group. Activities must be suitable for children. Food recommendations must include kid-friendly options. Ensure the pace is relaxed with short activity durations and regular rest/snack breaks." if trip_companions == 'Family' else ''}
    {solo_planning}

    CRITICAL BUDGET INSTRUCTION: The user's TOTAL budget is a STRICT HARD MAXIMUM of INR {budget}. This is the COMBINED budget for ALL travelers ({companions_description}) — NOT per person. The grand total of ALL costs MUST NOT EXCEED INR {budget}. Aim for the best quality experience that remains strictly within the INR {budget} limit.
    
    STRATEGY: Do NOT simply aim for the absolute lowest cost possible. Prioritize the BEST QUALITY EXPERIENCE (mid-range stays, good restaurants) that fits strictly within the limit. Only scale down to budget options if necessary. The sum of estimated_costs_inr fields MUST NOT exceed {budget}. Provide ALL rates/prices in a dual-format string showing BOTH Local Currency and INR (e.g., "$50 (₹4,100)" or "€10 (₹900)"). If the destination is India, just use INR (e.g., "₹500"). Identify specific "Savings Opportunities".

    CRITICAL FEATURES: 
    1. Weather Integration: Provide likely weather/season for {destination} during the trip period. Provide an approximate temperature range (e.g., "18°C - 25°C").
    2. Festivals & Events: Check for major local festivals or seasonal highlights in {destination} and include them if they align with the trip dates.
    3. Accessibility: Strictly adhere to {accessibility} requirements.
    4. Rest Time Allocation: Ensure appropriate rest periods based on {trip_pace} preference.

    CRITICAL STRUCTURE INSTRUCTION: Do not hallucinate extra fields. If the trip is possible, output ONLY a valid JSON object strictly matching this exact schema. If a value is unknown, use an empty string "" or 0, NEVER use unquoted text like N/A:
    {{
      "trip_title": "String",
      "destination_overview": "String (A single, concise paragraph describing the 'vibe' of the trip)",
      "weather_info": {{ 
        "forecast_summary": "String", 
        "approx_temperature_range": "String (e.g., '22°C - 28°C')",
        "visual_hints": "String (e.g., sunny, rainy, chilly, humid)" 
      }},
      "local_festivals": "String (Details of any ongoing/nearby festivals or 'None' if none)",
      "budget_compliance": "String (Provide a detailed, line-by-line itemized justification. Example: 'Transport: Local trains @ ₹500\\nAccommodation: 3-star @ ₹2000/night\\nFood: ₹1000/day = ₹3000\\nTotal: ₹14k vs ₹15k limit.')",
      "savings_opportunities": ["String"],
      "transportation": {{
        "mode": "String (the chosen travel_mode)",
        "suggestions_and_options": "String",
        "suggested_departure_time": "String (e.g., 08:00 AM)",
        "suggested_return_time": "String (e.g., 06:00 PM)"
      }},
      "daily_itinerary": [
        {{
          "day": Number,
          "theme": "String",
          "stay": {{
            "name": "String (Specific hotel/hostel/resort name, or '' if traveling)",
            "estimated_cost_per_night_inr": Number,
            "cost_display": "String (e.g., '$50 (₹4,100)' or '₹4,100')",
            "check_in_time": "String (e.g., 02:00 PM, or '')",
            "check_out_time": "String (e.g., 11:00 AM, or '')",
            "demo_booking_link": "String (Create a general redirect URL e.g., 'https://www.google.com/search?q=Hotel+Name', DO NOT pretend to book)"
          }},
          "activities": [
            {{
              "transit_to_activity": "String (EXPLICIT instruction on how to get here from previous location using {local_transit})",
              "distance_and_time": "String (e.g., '5km, 15 mins')",
              "arrival_time": "String (e.g., 10:00 AM)",
              "leaving_time": "String (e.g., 12:30 PM)",
              "activity": "String (Name of the place, activity, or restaurant/cafe)",
              "place_description": "String (Detailed history/significance and description of what to see or eat here. If it's a food break, mention the cuisine and approximate pricing in dual format. Max 2 concise paragraphs. Use \\n\\n)",
              "entry_fee_inr": Number,
              "fee_display": "String (e.g., '€20 (₹1,800)' or 'Free' or '₹500')",
              "demo_booking_link": "String (Create a general redirect URL e.g., 'https://www.google.com/search?q=Place+Name', DO NOT pretend to book)"
            }}
          ]
        }}
      ],
      "estimated_costs_inr": {{
        "accommodation": Number,
        "food": Number,
        "transport": Number,
        "activities": Number
      }}
    }}
    """

    if strict_budget:
        prompt += f"""
        ⚠️ EMERGENCY BUDGET OVERRIDE: A previous attempt exceeded the ₹{budget} limit.
        You MUST produce an itinerary where the estimated_costs_inr total is STRICTLY LESS THAN ₹{budget}.
        Prioritize value-for-money and mid-range options that bring the total within ₹{budget}.
        There are NO exceptions. The total MUST be under ₹{budget}.
        """

    client = get_gemini_client()
    MAX_RETRIES = 6
    BASE_DELAY_MS = 8000  # 8 seconds initial delay

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt
            )
            result_text = response.text or ""
            cleaned_result = result_text.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
            return json.loads(cleaned_result)
        except Exception as error:
            err_msg = str(error)
            is_429 = "429" in err_msg or "Quota" in err_msg or "rate limit" in err_msg.lower()
            is_503 = "503" in err_msg or "unavailable" in err_msg.lower() or "service unavailable" in err_msg.lower()

            if is_429:
                raise Exception("Gemini Free Tier API Rate Limit Exceeded. Please wait exactly 1 minute before trying again!")

            if is_503 and attempt < MAX_RETRIES:
                delay = (BASE_DELAY_MS * attempt) / 1000.0
                print(f"Gemini API unavailable (attempt {attempt}/{MAX_RETRIES}). Retrying in {delay}s...")
                time.sleep(delay)
                continue

            print("Gemini API Error:", error)
            try:
                with open("gemini_error.log", "w") as f:
                    import traceback
                    f.write(traceback.format_exc())
            except Exception:
                pass

            if is_503:
                raise Exception("The AI model is currently under high demand. Please try again in a few minutes.")

            raise Exception(f"AI engine failed: {err_msg}")
