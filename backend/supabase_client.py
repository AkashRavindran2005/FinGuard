import os
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import Header, HTTPException, Depends

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase URL or Key not found in environment variables.")

# Create the Supabase client using the service role key to bypass RLS when acting on behalf of the user 
# in the backend (we enforce security at the API layer by verifying the token).
# Alternatively, you can use the anon key if your backend is purely a proxy for RLS, but service role is standard for server-side logic.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_current_user(authorization: str = Header(...)):
    """
    FastAPI dependency to verify the JWT token from the frontend.
    Returns the Supabase user ID.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.split(" ")[1]
    
    try:
        # Get user using the token
        res = supabase.auth.get_user(token)
        user = res.user
        if not user:
             raise HTTPException(status_code=401, detail="Invalid token")
        return user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
