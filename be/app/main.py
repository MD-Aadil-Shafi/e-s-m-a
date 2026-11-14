from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


app = FastAPI(title = "Employee Salary Management")

origins = [
    "*",
    # "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/test")
async def test()->dict:
    return {"message": "test route working fine."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)