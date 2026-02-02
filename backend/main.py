from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.upload import router as upload_router
from routes.corrections import router as correction_router
from routes.save import router as save_router
from routes.reprocess import router as reprocess_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("❌ BACKEND ERROR:", exc)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)}
    )

app.include_router(upload_router)
app.include_router(correction_router)
app.include_router(save_router)
app.include_router(reprocess_router)
