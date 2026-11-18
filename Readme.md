# Prerequisites and application setup
Node version 21 or higher & Python version 3.10 or higher.

### Simple steps to run in dev mode:
1. Development PostgreSQL instance setup:

Create a .env file in be root.
paste the following or similar content to .env file

```bach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_DB=empDb

DATABASE_URL=postgresql+asyncpg://postgres:password123@localhost:5432/empDb
DATABASE_URL_SYNC=postgresql+psycopg2://postgres:password123@localhost:5432/empDb

SECRET_KEY=kdjasriu8e4djkashh
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=720 # this much long for dev mode, reduced for production environment.
REFRESH_TOKEN_EXPIRE_DAYS=7
```

```bash
cd be
docker compose up -d
``` 
it'll fetch postgres image and start the container with volume persistence.

2. Activate virtual environment for backend
For git bash:
```bash
cd be
venv/Scripts/activate
```
For Windows:
```bash
cd be
for .\venv\Scripts\Activate.ps1
```
Install the packages:
pip install -r requirements.txt

3. Run DB migration: after activating venv

```bash
cd be
alembic upgrade head
```

Seed sample data for seed scripts:

```bash
cd be
python -m scripts.seed_employees
```
It'll seed records of 10K employees in batches of 1K.

4. Start backend:
```bash
cd be
python -m app.main
```

5. To run frontend in dev mode:

```bash
cd fe
npm i
npm run dev
```

### PORTS:
backend will start on port 8000
```url
http://localhost:8000
```

frontend will start on port 5173
```url
http://localhost:5173
```

## To run tests:
For backend:
```bash
cd be
pytest -v
```
For frontend:
```bash
cd fe
npm run test
```

### Future enhancement:
Will add single command of "docker compose up -d" to run all services.

## Short architecture overview:
<img width="1442" height="726" alt="image" src="https://github.com/user-attachments/assets/ec9ddc31-fdfe-4a5b-bca6-938ec617d363" />

The application follows a simple three-layer architecture using Python FastAPI, TypeScript, React.js and PostgreSQL.

1. Frontend: Hr professionals with role HR can access, modify, create employee records, salary records, base pay records, view logs, view previous histories etc.
2. Backend API: FastAPI handles authentication, authorization and business logic.
3. Database: PostgreSQL stores User, Refresh Token, Employee, Salary, Log and Base Pay records. 

For more depth information please read Requirements.md file.
