# Data Analytics Platform

A simplified Power BI-style data analytics MVP built with **FastAPI + React**.

## Features

- **File Upload** – CSV / Excel upload with automatic metadata detection
- **Dataset Summary** – Column types, missing values, descriptive statistics
- **Automatic Charts** – Histogram, bar, line, and boxplot auto-generated from data
- **Forecasting** – Linear regression time-series forecast

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Backend  | Python, FastAPI, pandas, NumPy, scikit-learn, SQLAlchemy |
| Database | PostgreSQL                                          |
| Frontend | React (Vite), Axios, Recharts, TailwindCSS          |

---

## Quick Start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

---

## Manual Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL running locally

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE analytics_db;
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App at http://localhost:5173

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Settings & env vars
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models.py           # ORM models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── routes/
│   │   │   └── datasets.py     # API endpoints
│   │   └── services/
│   │       ├── file_service.py      # File I/O
│   │       ├── analysis_service.py  # Column analysis
│   │       ├── chart_service.py     # Chart suggestions
│   │       └── forecast_service.py  # Linear regression forecast
│   ├── uploads/                # Uploaded files
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── UploadPage.jsx
│   │       ├── DatasetPage.jsx
│   │       └── ForecastPage.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| POST   | `/api/upload`                   | Upload CSV / Excel file        |
| GET    | `/api/datasets`                 | List all datasets              |
| GET    | `/api/dataset/{id}/summary`     | Column statistics              |
| GET    | `/api/dataset/{id}/preview`     | Paginated data preview         |
| GET    | `/api/dataset/{id}/charts`      | Auto-generated chart configs   |
| POST   | `/api/dataset/{id}/forecast`    | Run linear regression forecast |

---

## License

MIT
