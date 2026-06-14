# 🤝 JobMatch AI

A full-stack AI-powered job matching platform that aggregates real-time job listings via the Adzuna API, matches them to user profiles, and provides a seamless experience with Google OAuth authentication.

---

## 🚀 Overview

JobMatch AI helps job seekers discover relevant opportunities by matching their skills and preferences against live job listings. Built with a FastAPI backend, React frontend, and MongoDB for persistence — with Google OAuth for frictionless login.

---

## ✨ Features

- 🔐 **Google OAuth** — one-click sign in, session managed via MongoDB
- 🔍 **Live Job Search** — real-time listings fetched from the Adzuna Jobs API
- 🎯 **Smart Matching** — filters and ranks jobs based on user profile and preferences
- 📄 **Resume Management** — store and retrieve current resume data per user
- 🧠 **Memory Layer** — persistent user context across sessions (`/memory`)
- 📊 **Dashboard** — clean UI to browse, filter, and track matched jobs

---

## 📁 Project Structure

```
JobMatchAI/
├── backend/              # FastAPI application
│   ├── routes/           # API route handlers (auth, jobs, resume, user)
│   ├── models/           # MongoDB document models
│   ├── services/         # Adzuna API integration, matching logic
│   └── main.py           # App entry point
├── frontend/             # React + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Dashboard, Login, Profile pages
│   │   └── App.jsx       # Root component with routing
│   └── package.json
├── memory/               # Persistent user context/memory store
├── auth_testing.md       # Auth flow testing playbook
├── design_guidelines.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React, Tailwind CSS |
| Database | MongoDB |
| Auth | Google OAuth 2.0 + Session Tokens |
| Job Data | Adzuna Jobs API |
| Session Store | MongoDB (`user_sessions` collection) |

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)
- Adzuna API credentials → [adzuna.com/api](https://developer.adzuna.com/)
- Google OAuth credentials → [Google Cloud Console](https://console.cloud.google.com/)

---

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=jobmatchai
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:5173
```

```bash
uvicorn main:app --reload
```

API runs at `http://localhost:8000`

---

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🔐 Auth Flow

1. User clicks "Sign in with Google"
2. Backend exchanges OAuth code for Google profile
3. User document created/updated in MongoDB
4. Session token generated and stored in `user_sessions` collection
5. Token set as `HttpOnly` cookie for subsequent requests
6. Protected routes validate session via `/api/auth/me`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/google` | Initiate Google OAuth |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/jobs/search` | Search jobs via Adzuna |
| `GET` | `/api/jobs/matches` | Get matched jobs for user |
| `GET` | `/api/resume/current` | Fetch user's resume |
| `POST` | `/api/resume/update` | Update resume data |

---

## 🧪 Testing Auth

See [`auth_testing.md`](./auth_testing.md) for a full playbook including:
- Creating test users and sessions via `mongosh`
- Testing protected API endpoints with `curl`
- Browser session simulation

---

## 👩‍💻 Author

**Apoorva Singh**  
B.Tech ECE | IIIT Manipur  
[GitHub](https://github.com/Apoorvasingh08) · [LinkedIn](https://linkedin.com/in/apoorva-singh)
