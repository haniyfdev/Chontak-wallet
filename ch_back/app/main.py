import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routers import admin, auth, avatar, card, saved_card, transactions

app = FastAPI(title="Chontak", 
              description="Chontak fintech-wallet loyihasi !",
              version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(avatar.router, prefix="/api/avatar", tags=["avatar"])
app.include_router(card.router, prefix="/api/card", tags=["card"])
app.include_router(saved_card.router, prefix="/api/saved-card", tags=["saved-card"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])

@app.get("/", tags=["health"])
async def health_check():
    return {
        "status": "running",
        "app": "Chontak Wallet",
        "version": "1.1.0"
    }

