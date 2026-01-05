# main.py
import asyncio
from fastapi import FastAPI, HTTPException, Depends, Body, Path
from fastapi.middleware.cors import CORSMiddleware
from schemas.integrations import TelegramIntegrationModel, GreenAPIIntegrationModel, GoogleSheetsIntegrationModel
from motor.motor_asyncio import AsyncIOMotorClient
from schemas.assistant import AIAssistantModel, AIAssistantUpdateModel, FunctionModel
from vectore_store_router import create_vector_store_router
from typing import Optional, Dict, Any, List, Annotated
import os
import logging
from datetime import datetime
from functions_router import create_functions_router
from bson import ObjectId

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongodb:27017")
DB_NAME = os.getenv("DB_NAME", "ai_assistant_db")

mongodb_client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global mongodb_client, db
    mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    db = mongodb_client[DB_NAME]
    
    collections = ["assistants", "telegram_integrations", "whatsapp_integrations", "google_sheets_integrations"]
    for collection in collections:
        if collection not in await db.list_collection_names():
            await db.create_collection(collection)
            logger.info(f"Created collection: {collection}")
    
    functions_router = create_functions_router(db)
    vector_store_router = create_vector_store_router(db)
    
    app.include_router(functions_router)
    app.include_router(vector_store_router)
    
    logger.info("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        logger.info("Disconnected from MongoDB")

async def get_assistant(assistant_id: str):
    assistant = await db.assistants.find_one({"_id": ObjectId(assistant_id)})
    if assistant is None:
        raise HTTPException(status_code=404, detail="Assistant not found")
    assistant["_id"] = str(assistant["_id"])
    return assistant

@app.get("/assistants", response_model=List[AIAssistantModel])
async def get_assistants():
    assistants = await db.assistants.find().to_list(None)
    for assistant in assistants:
        assistant["_id"] = str(assistant["_id"])
    return assistants

@app.post("/ai-config", response_model=AIAssistantModel, include_in_schema=True)
async def create_assistant(assistant: AIAssistantModel = Body(...)):
    assistant_dict = assistant.dict(exclude={"assistant_id", "created_at", "updated_at"})
    assistant_dict["created_at"] = datetime.now()
    
    result = await db.assistants.insert_one(assistant_dict)
    
    created_assistant = await db.assistants.find_one({"_id": result.inserted_id})
    
    created_assistant["_id"] = str(created_assistant["_id"])
    
    return created_assistant

@app.get("/ai-config/{assistant_id}", response_model=AIAssistantModel)
async def get_assistant_config(assistant: dict = Depends(get_assistant)):
    return assistant

@app.put("/ai-config/{assistant_id}", response_model=AIAssistantModel)
async def update_assistant_full(assistant_id: str, assistant: AIAssistantModel = Body(...)):
    assistant_dict = assistant.model_dump(exclude={"assistant_id", "created_at"})
    assistant_dict["updated_at"] = datetime.now()
    
    await db.assistants.update_one(
        {"_id": ObjectId(assistant_id)},
        {"$set": assistant_dict}
    )
    
    updated_assistant = await db.assistants.find_one({"_id": ObjectId(assistant_id)})
    if updated_assistant is None:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    updated_assistant["_id"] = str(updated_assistant["_id"])
    
    return updated_assistant

@app.patch("/ai-config/{assistant_id}", response_model=AIAssistantModel)
async def update_assistant_partial(assistant_id: str, update_data: AIAssistantUpdateModel = Body(...)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.now()
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.assistants.update_one(
        {"_id": ObjectId(assistant_id)},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    updated_assistant = await db.assistants.find_one({"_id": ObjectId(assistant_id)})
    return updated_assistant

@app.patch("/ai-config/{assistant_id}/{field}", response_model=AIAssistantModel)
async def update_assistant_field(
    assistant_id: str, 
    field: str = Path(..., description="Field to update"),
    value: Any = Body(..., embed=True)
):
    valid_fields = [
        "openai_id", "name", "model", "instructions", "temperature", 
        "functions_on", "message_buffer", "hello_message", "error_message",
        "max_tokens", "search_count", "truncation_strategy", "min_relatedness"
    ]
    
    if field not in valid_fields:
        raise HTTPException(status_code=400, detail=f"Invalid field: {field}")
    
    update_dict = {field: value, "updated_at": datetime.now()}
    
    result = await db.assistants.update_one(
        {"_id": ObjectId(assistant_id)},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    updated_assistant = await db.assistants.find_one({"_id": ObjectId(assistant_id)})
    return updated_assistant

@app.get("/get_all_telegram_integrations")
async def get_all_telegram_integrations():
    integrations = await db.telegram_integrations.find().to_list(None)
    for integration in integrations:
        integration["_id"] = str(integration["_id"])
    return integrations

@app.post("/telegram-integration/{bot_token}")
async def setup_telegram_integration(
    bot_token: str,
    integration: TelegramIntegrationModel = Body(...)
):
    integration_dict = integration.dict()
    integration_dict["bot_token"] = bot_token
    
    assistant = await db.assistants.find_one({"_id": ObjectId(integration_dict["assistant_id"])})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    existing = await db.telegram_integrations.find_one({"bot_token": bot_token})
    if existing:
        await db.telegram_integrations.update_one(
            {"bot_token": bot_token},
            {"$set": integration_dict}
        )
        return {"status": "updated", "message": "Telegram integration updated successfully"}
    else:
        await db.telegram_integrations.insert_one(integration_dict)
        return {"status": "created", "message": "Telegram integration created successfully"}
    
@app.delete("/delete_telegram_integration/{integration_id}")
async def delete_telegram_integration(integration_id: str):
    result = await db.telegram_integrations.delete_one({"_id": ObjectId(integration_id)})
    if result.deleted_count:
        return {"status": "deleted", "message": "Telegram integration deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Telegram integration not found")

@app.get("/all-greenapi-integrations")
async def get_all_greenapi_integrations():
    integrations = await db.whatsapp_integrations.find().to_list(None)
    for integration in integrations:
        integration["_id"] = str(integration["_id"])
    return integrations

@app.post("/greenapi-integration")
async def setup_greenapi_integration(integration: GreenAPIIntegrationModel = Body(...)):
    integration_dict = integration.model_dump()
    
    assistant = await db.assistants.find_one({"_id": ObjectId(integration_dict["assistant_id"])})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    existing = await db.whatsapp_integrations.find_one({"instance_id": integration_dict["instance_id"]})
    if existing:
        await db.whatsapp_integrations.update_one(
            {"instance_id": integration_dict["instance_id"]},
            {"$set": integration_dict}
        )
        return {"status": "updated", "message": "GreenAPI WhatsApp integration updated successfully"}
    else:
        await db.whatsapp_integrations.insert_one(integration_dict)
        return {"status": "created", "message": "GreenAPI WhatsApp integration created successfully"}

@app.delete("/delete_whatsapp_integration/{integration_id}")
async def delete_whatsapp_integration(integration_id: str):
    result = await db.whatsapp_integrations.delete_one({"_id": ObjectId(integration_id)})
    if result.deleted_count:
        return {"status": "deleted", "message": "WhatsApp integration deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="WhatsApp integration not found")

@app.get("/get_all_google_sheets_integration")
async def get_all_google_sheets_integration():
    integrations = await db.google_sheets_integrations.find().to_list(None)
    for integration in integrations:
        integration["_id"] = str(integration["_id"])
    return integrations

@app.post("/google-sheets-integration")
async def setup_google_sheets_integration(integration: GoogleSheetsIntegrationModel = Body(...)):
    integration_dict = integration.model_dump()
    
    assistant = await db.assistants.find_one({"_id": ObjectId(integration_dict["assistant_id"])})
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    existing = await db.google_sheets_integrations.find_one({
        "spreadsheet_id": integration_dict["spreadsheet_id"],
        "assistant_id": ObjectId(integration_dict["assistant_id"])
    })
    
    if existing:
        await db.google_sheets_integrations.update_one(
            {
                "spreadsheet_id": integration_dict["spreadsheet_id"],
                "assistant_id": ObjectId(integration_dict["assistant_id"])
            },
            {"$set": integration_dict}
        )
        return {"status": "updated", "message": "Google Sheets integration updated successfully"}
    else:
        await db.google_sheets_integrations.insert_one(integration_dict)
        return {"status": "created", "message": "Google Sheets integration created successfully"}
    
@app.delete("/delete_google_sheets_integration/{integration_id}")
async def delete_google_sheets_integration(integration_id: str):
    result = await db.google_sheets_integrations.delete_one({"_id": ObjectId(integration_id)})
    if result.deleted_count:
        return {"status": "deleted", "message": "Google Sheets integration deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Google Sheets integration not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)