from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Initialize AsyncIOMotorClient
client = AsyncIOMotorClient(settings.MONGO_URI)

# Get the database name from MONGO_URI
# e.g. "mongodb://localhost:27017/traverse" -> "traverse"
db_name = settings.MONGO_URI.split("/")[-1].split("?")[0]
if not db_name:
    db_name = "traverse"

db = client[db_name]

# Expose collections
users_col = db.users
trips_col = db.trips
budgets_col = db.budgets
chat_logs_col = db.chat_logs

async def connect_db():
    try:
        # The ismaster command is cheap and does not require auth.
        await db.command("ping")
        print(f"MongoDB connected: {db_name}")
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        import sys
        sys.exit(1)

async def disconnect_db():
    client.close()
    print("MongoDB disconnected")
