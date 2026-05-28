from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
import PyPDF2
import docx
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent configs
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
ADZUNA_APP_ID = os.environ.get('ADZUNA_APP_ID', 'your_app_id_here')
ADZUNA_APP_KEY = os.environ.get('ADZUNA_APP_KEY', 'your_app_key_here')

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "job-search-app"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logging.error(f"Storage init failed: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str

class SessionExchange(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    user: User
    session_token: str

class ResumeInfo(BaseModel):
    resume_id: str
    user_id: str
    original_filename: str
    parsed_text: str
    storage_path: str
    created_at: str

class UserInterests(BaseModel):
    user_id: str
    skills: List[str]
    job_types: List[str]
    locations: List[str]
    created_at: str

class InterestsInput(BaseModel):
    skills: List[str]
    job_types: List[str]
    locations: List[str]

class SavedJob(BaseModel):
    job_id: str
    user_id: str
    job_data: Dict[str, Any]
    saved_at: str

class SaveJobInput(BaseModel):
    job_data: Dict[str, Any]

class JobApplication(BaseModel):
    application_id: str
    user_id: str
    job_id: str
    job_data: Dict[str, Any]
    status: str
    applied_at: str

class ApplyJobInput(BaseModel):
    job_id: str
    job_data: Dict[str, Any]

# Helper: Get user from session token
async def get_current_user(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)) -> User:
    token = None
    if session_token:
        token = session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# Helper: Parse PDF
def parse_pdf(file_bytes: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

# Helper: Parse DOCX
def parse_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")

# Helper: Extract skills with AI
async def extract_skills_from_resume(resume_text: str) -> List[str]:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"resume_parse_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert resume analyzer. Extract key skills, technologies, and competencies from resumes."
        ).with_model("openai", "gpt-5.4")
        
        message = UserMessage(
            text=f"Extract all technical skills, soft skills, and competencies from this resume. Return ONLY a comma-separated list of skills, nothing else:\n\n{resume_text[:3000]}"
        )
        
        response = await chat.send_message(message)
        skills = [s.strip() for s in response.split(",") if s.strip()]
        return skills[:30]
    except Exception as e:
        logging.error(f"AI skill extraction failed: {e}")
        return []

# Auth Endpoints
@api_router.post("/auth/session", response_model=SessionResponse)
async def exchange_session(data: SessionExchange):
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id},
            timeout=10
        )
        resp.raise_for_status()
        user_data = resp.json()
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": user_data["name"], "picture": user_data["picture"]}}
            )
        else:
            user_doc = {
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
        
        session_token = user_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        user_obj = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        response = JSONResponse(content={
            "user": user_obj,
            "session_token": session_token
        })
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        return response
    except Exception as e:
        logging.error(f"Session exchange failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to exchange session")

@api_router.get("/auth/me", response_model=User)
async def get_me(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    token = session_token if session_token else (authorization.replace("Bearer ", "") if authorization else None)
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token", path="/")
    return response

# Resume Endpoints
@api_router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    file_bytes = await file.read()
    
    if file.filename.lower().endswith('.pdf'):
        parsed_text = parse_pdf(file_bytes)
    else:
        parsed_text = parse_docx(file_bytes)
    
    if not parsed_text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")
    
    ext = file.filename.split(".")[-1]
    storage_path = f"{APP_NAME}/resumes/{user.user_id}/{uuid.uuid4()}.{ext}"
    
    result = put_object(storage_path, file_bytes, file.content_type or "application/octet-stream")
    
    await db.resumes.update_many({"user_id": user.user_id}, {"$set": {"is_deleted": True}})
    
    resume_id = f"resume_{uuid.uuid4().hex[:12]}"
    resume_doc = {
        "resume_id": resume_id,
        "user_id": user.user_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "parsed_text": parsed_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_deleted": False
    }
    await db.resumes.insert_one(resume_doc)
    
    skills = await extract_skills_from_resume(parsed_text)
    
    return {
        "resume_id": resume_id,
        "filename": file.filename,
        "parsed_length": len(parsed_text),
        "extracted_skills": skills
    }

@api_router.get("/resume/current")
async def get_current_resume(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    resume = await db.resumes.find_one({"user_id": user.user_id, "is_deleted": False}, {"_id": 0})
    if not resume:
        return None
    return resume

# Interests Endpoints
@api_router.post("/interests")
async def save_interests(data: InterestsInput, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    
    await db.user_interests.delete_many({"user_id": user.user_id})
    
    interests_doc = {
        "user_id": user.user_id,
        "skills": data.skills,
        "job_types": data.job_types,
        "locations": data.locations,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_interests.insert_one(interests_doc)
    return {"message": "Interests saved successfully"}

@api_router.get("/interests")
async def get_interests(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    interests = await db.user_interests.find_one({"user_id": user.user_id}, {"_id": 0})
    return interests

# Job Search Endpoints
@api_router.get("/jobs/search")
async def search_jobs(
    query: str,
    location: Optional[str] = "us",
    page: int = 1,
    authorization: Optional[str] = Header(None),
    session_token: Optional[str] = Cookie(None)
):
    user = await get_current_user(authorization, session_token)
    
    try:
        url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/{page}"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "what": query,
            "results_per_page": 20
        }
        
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        resume = await db.resumes.find_one({"user_id": user.user_id, "is_deleted": False}, {"_id": 0})
        
        if resume and resume.get("parsed_text"):
            for job in data.get("results", []):
                try:
                    chat = LlmChat(
                        api_key=EMERGENT_LLM_KEY,
                        session_id=f"match_{uuid.uuid4().hex[:8]}",
                        system_message="You are a job matching expert. Provide a match score (0-100) based on resume and job description."
                    ).with_model("openai", "gpt-5.4")
                    
                    message = UserMessage(
                        text=f"Resume skills: {resume['parsed_text'][:500]}\n\nJob: {job.get('title', '')} - {job.get('description', '')[:500]}\n\nProvide only a number 0-100 for match score, nothing else."
                    )
                    
                    score_text = await chat.send_message(message)
                    job["match_score"] = int(score_text.strip())
                except:
                    job["match_score"] = 50
        else:
            for job in data.get("results", []):
                job["match_score"] = 50
        
        data["results"].sort(key=lambda x: x.get("match_score", 0), reverse=True)
        
        return data
    except Exception as e:
        logging.error(f"Job search failed: {e}")
        raise HTTPException(status_code=500, detail="Job search failed")

@api_router.post("/jobs/save")
async def save_job(data: SaveJobInput, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    
    job_id = data.job_data.get("id", str(uuid.uuid4()))
    
    existing = await db.saved_jobs.find_one({"user_id": user.user_id, "job_id": job_id})
    if existing:
        return {"message": "Job already saved"}
    
    saved_doc = {
        "job_id": job_id,
        "user_id": user.user_id,
        "job_data": data.job_data,
        "saved_at": datetime.now(timezone.utc).isoformat()
    }
    await db.saved_jobs.insert_one(saved_doc)
    return {"message": "Job saved successfully"}

@api_router.get("/jobs/saved")
async def get_saved_jobs(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    jobs = await db.saved_jobs.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return jobs

@api_router.delete("/jobs/saved/{job_id}")
async def delete_saved_job(job_id: str, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    await db.saved_jobs.delete_one({"user_id": user.user_id, "job_id": job_id})
    return {"message": "Job removed"}

@api_router.post("/jobs/apply")
async def apply_job(data: ApplyJobInput, authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    
    existing = await db.job_applications.find_one({"user_id": user.user_id, "job_id": data.job_id})
    if existing:
        return {"message": "Already applied to this job"}
    
    app_doc = {
        "application_id": f"app_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "job_id": data.job_id,
        "job_data": data.job_data,
        "status": "applied",
        "applied_at": datetime.now(timezone.utc).isoformat()
    }
    await db.job_applications.insert_one(app_doc)
    return {"message": "Application recorded"}

@api_router.get("/jobs/applications")
async def get_applications(authorization: Optional[str] = Header(None), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(authorization, session_token)
    apps = await db.job_applications.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return apps

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()