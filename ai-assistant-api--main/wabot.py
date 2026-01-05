import os
import asyncio
import traceback
import logging
from fastapi import FastAPI, Request, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
from schemas.integrations import GreenAPIIntegrationModel
from services.whatsapp_service import GreenAPIWhatsAppService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WhatsApp Bot Service", version="1.0.0")

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongodb:27017")
DB_NAME = os.getenv("DB_NAME", "ai_assistant_db")

mongodb_client = None
db = None
whatsapp_services = {}
greenapi_services = {}

@app.on_event("startup")
async def startup_db_client():
    global mongodb_client, db
    mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    db = mongodb_client[DB_NAME]
    logger.info("Connected to MongoDB")
    
    await initialize_greenapi_services()

@app.on_event("shutdown")
async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        logger.info("Disconnected from MongoDB")

async def initialize_greenapi_services():
    global greenapi_services
    try:
        integrations = await db.whatsapp_integrations.find().to_list(None)
        for integration in integrations:
            service_key = str(integration.get('instance_id'))
            if service_key:
                greenapi_services[service_key] = GreenAPIWhatsAppService(
                    integration['instance_id'],
                    integration['api_token'],
                    integration['assistant_id'],
                    mongodb_client,
                    integration.get('nums', 7105)
                )
                logger.info(f"Initialized GreenAPI WhatsApp service for instance_id: {integration['instance_id']}")
    except Exception as e:
        logger.error(f"Error initializing GreenAPI WhatsApp services: {str(e)}")

@app.post("/webhook")
async def webhook(request: Request):
    try:
        data = await request.json()

        logger.info(f"Received webhook data: {json.dumps(data, default=str)}")
        
        webhook_type = data.get('typeWebhook')
        
        if webhook_type == "outgoingMessageStatus":
            logger.info(f"Received status update for message {data.get('idMessage')}: {data.get('status')}")
            return {"status": "success", "message": "Status update received"}
        
        elif webhook_type == "incomingMessageReceived":
            instance_id = str(data.get('instanceData', {}).get('idInstance'))
            
            if not instance_id or instance_id not in greenapi_services:
                logger.info(f"Service for instance_id {instance_id} not found, initializing services...")
                await initialize_greenapi_services()
                
                if instance_id not in greenapi_services:
                    raise HTTPException(status_code=404, detail=f"No service found for instance_id: {instance_id}")
            
            result = await greenapi_services[instance_id].process_webhook(data)
            return result
        
        else:
            logger.info(f"Received webhook of type: {webhook_type}")
            return {"status": "success", "message": f"Webhook of type {webhook_type} received"}
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(e)
        logger.error(f"Error processing webhook: {str(e)}\n{error_trace}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/webhook")
async def verify_webhook(request: Request):
    return {"status": "success", "message": "Webhook endpoint is active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("wabot:app", host="0.0.0.0", port=8001, reload=True)