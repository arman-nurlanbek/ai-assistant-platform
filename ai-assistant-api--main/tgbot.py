import os
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from services.telegram_service import TelegramBotService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongodb:27017")
DB_NAME = os.getenv("DB_NAME", "ai_assistant_db")

async def main():
    try:
        mongodb_client = AsyncIOMotorClient(MONGODB_URL)
        db = mongodb_client[DB_NAME]
        logger.info("Connected to MongoDB")
        
        telegram_integrations = await db.telegram_integrations.find().to_list(None)
        
        if not telegram_integrations:
            logger.warning("No Telegram integrations found. Waiting for configuration...")
            while not telegram_integrations:
                await asyncio.sleep(30)
                telegram_integrations = await db.telegram_integrations.find().to_list(None)
        
        bot_tasks = []
        for integration in telegram_integrations:
            bot_service = TelegramBotService(
                integration['bot_token'],
                integration['assistant_id'],
                mongodb_client
            )
            bot_task = asyncio.create_task(bot_service.start_bot())
            bot_tasks.append(bot_task)
            logger.info(f"Started Telegram bot for assistant {integration['assistant_id']}")
        
        await asyncio.gather(*bot_tasks)
        
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
    finally:
        if 'mongodb_client' in locals():
            mongodb_client.close()
            logger.info("Disconnected from MongoDB")

if __name__ == "__main__":
    asyncio.run(main())