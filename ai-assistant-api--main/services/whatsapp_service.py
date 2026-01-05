import os
import asyncio
import logging
import requests
import json
import traceback
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from services.openai_service import OpenAIService
from services.vector_service import VectorSearchService
from services.googlesheets_service import GoogleSheetsService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GreenAPIWhatsAppService:
    def __init__(self, instance_id, api_token, assistant_id, mongodb_client, nums=7105):
        self.instance_id = instance_id
        self.api_token = api_token
        self.assistant_id = ObjectId(assistant_id)
        self.db = mongodb_client[os.getenv("DB_NAME", "ai_assistant_db")]
        self.user_sessions = {}
        self.base_url = f"https://{nums}.api.greenapi.com/waInstance{self.instance_id}"
        self.vector_search = VectorSearchService(self.db)
    
    async def process_webhook(self, data):
        try:
            logger.info(f"Processing webhook data: {data}")
            
            if data.get('typeWebhook') == 'incomingMessageReceived':
                message_data = data.get('messageData', {})
                
                if not message_data:
                    logger.error("Missing 'messageData' in webhook")
                    return {"status": "error", "message": "No message data"}
                
                message_type = message_data.get('typeMessage')
                
                if message_type == 'textMessage':
                    text = message_data.get('textMessageData', {}).get('textMessage', '')
                    sender = data.get('senderData', {}).get('sender', '').split('@')[0]
                    
                    await self.store_message_history(
                        user_id=sender,
                        message=text,
                        message_type="user"
                    )
                    
                    if sender and text:
                        response_message = await self.handle_message(sender, text)
                        
                        await self.store_message_history(
                            user_id=sender,
                            message=response_message,
                            message_type="bot"
                        )
                        
                        return {"status": "success", "message": "Text message processed"}
                
                elif message_type == 'stickerMessage' or message_type == 'imageMessage' or message_type == 'documentMessage':
                    sender = data.get('senderData', {}).get('sender', '').split('@')[0]
                    if sender:
                        await self.send_message(sender, "Я получил ваше медиа сообщение, но могу обрабатывать только текст.")
                        return {"status": "success", "message": f"{message_type} received"}
                
                return {"status": "success", "message": f"Message type {message_type} not supported"}
            
            return {"status": "success", "message": "Not a message webhook"}
            
        except Exception as e:
            error_trace = traceback.format_exc()  
            logger.error(f"Error processing webhook: {str(e)}\n{error_trace}")
            return {"status": "error", "message": str(e)}

    
    async def handle_message(self, user_id, message_text):
        try:
            assistant = await self.db.assistants.find_one({"_id": self.assistant_id})
            if not assistant:
                await self.send_message(user_id, "Ассистент не настроен!")
                return "Ассистент не настроен!"
            
            if user_id not in self.user_sessions:
                self.user_sessions[user_id] = []
                await self.send_message(user_id, assistant.get("hello_message", "Я готов консультировать!"))
            
            kb_results = await self.vector_search.search_knowledge_base(
                query=message_text,
                assistant_id=str(self.assistant_id),
                limit=3
            )
            
            kb_context = self.vector_search.format_context(kb_results)
            
            self.user_sessions[user_id].append({"role": "user", "content": message_text})
            
            system_message = assistant.get("instructions", "")
            if kb_context:
                system_message += f"\n\n{kb_context}"
                
            self.user_sessions[user_id].append({"role": "system", "content": system_message})
            
            self.truncate_conversation_history(user_id, assistant)
            
            functions = []
            if assistant.get("functions_on", True):
                # Check for save_user_data function
                save_user_data_func = await self.db.save_user_data_function.find_one({"assistant_id": self.assistant_id})
                
                if save_user_data_func:
                    # Use the pre-configured parameters for the function
                    functions.append({
                        "type": "function",
                        "function": {
                            "name": "save_user_data",
                            "description": "Save user data to the system",
                            "parameters": save_user_data_func.get("parameters", {})
                        }
                    })
                
                # Add any additional custom functions
                function_docs = await self.db.functions.find({
                    "assistant_id": self.assistant_id,
                    "name": {"$ne": "save_user_data"}  # Exclude save_user_data as we've already added it
                }).to_list(None)
                
                for func in function_docs:
                    functions.append({
                        "type": "function",
                        "function": {
                            "name": func["name"],
                            "description": func.get("description", ""),
                            "parameters": func.get("parameters", {})
                        }
                    })

            openai_service = OpenAIService(api_key=assistant.get("openai_id"))
            
            response = await openai_service.generate_response(
                messages=self.user_sessions[user_id],
                model=assistant.get("model", "gpt-4"),
                temperature=assistant.get("temperature", 0.7),
                max_tokens=assistant.get("max_tokens", 2000),
                functions=functions if functions else None
            )
            
            processed_response = await openai_service.process_function_calls(response)
            
            if processed_response["function_calls"]:
                response_message = await self.handle_function_calls(processed_response["function_calls"], user_id)
            else:
                response_message = processed_response["content"]
            
            self.user_sessions[user_id].append({"role": "assistant", "content": response_message})
            
            await self.send_message(user_id, response_message)
            
            await self.store_conversation_to_sheets(user_id, message_text, response_message)

            return response_message
            
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            error_message = assistant.get("error_message", "Извините, не доступен, обратитесь позже.")
            await self.send_message(user_id, error_message)
            return error_message
    
    async def handle_function_calls(self, function_calls, user_id):        
        function_responses = []
        
        for call in function_calls:
            try:
                func_name = call["name"]
                args = json.loads(call["arguments"])
                
                if func_name == "save_user_data":
                    # Handle save_user_data function
                    result = await self.process_save_user_data(user_id, args)
                    function_responses.append(result)
                else:
                    # Handle other functions
                    args_str = ", ".join([f"{k}={v}" for k, v in args.items()])
                    function_responses.append(f"Функция вызвана: {func_name}({args_str})")
            
            except Exception as e:
                logger.error(f"Error processing function call: {str(e)}")
                function_responses.append(f"Функция вызвана: {call['name']} (ошибка: {str(e)})")
        
        return "\n".join(function_responses)
    
    async def process_save_user_data(self, user_id, args):
        """
        Process save_user_data function call and write data to Google Sheets.
        """
        try:
            # Get save_user_data configuration
            save_user_data_config = await self.db.save_user_data_function.find_one({"assistant_id": self.assistant_id})
            
            if not save_user_data_config:
                return "Ошибка: функция save_user_data не настроена"
            
            # Try to get Google Sheets integration in different ways
            sheets_integration = None
            
            # 1. Try to get by the specific integration_id saved in the config
            if save_user_data_config.get("integration_id"):
                sheets_integration = await self.db.google_sheets_integrations.find_one(
                    {"_id": ObjectId(save_user_data_config["integration_id"])}
                )
            
            # 2. Try to get by the assistant_id as ObjectId
            if not sheets_integration:
                sheets_integration = await self.db.google_sheets_integrations.find_one(
                    {"assistant_id": self.assistant_id}
                )
            
            # 3. Try to get by the assistant_id as string
            if not sheets_integration:
                sheets_integration = await self.db.google_sheets_integrations.find_one(
                    {"assistant_id": str(self.assistant_id)}
                )
            
            # 4. Just get the first integration as fallback
            if not sheets_integration:
                integrations = await self.db.google_sheets_integrations.find().to_list(None)
                if integrations and len(integrations) > 0:
                    sheets_integration = integrations[0]
                    logger.warning(f"Using fallback integration with ID: {sheets_integration.get('_id')}")
            
            if not sheets_integration:
                return "Ошибка: Google Sheets интеграция не настроена"
            
            try:
                sheets_service = GoogleSheetsService(
                    sheets_integration.get("credentials_json"),
                    sheets_integration.get("spreadsheet_id")
                )
            except Exception as e:
                logger.error(f"Error initializing Google Sheets service: {str(e)}")
                return f"Ошибка инициализации Google Sheets: {str(e)}"
            
            # Prepare data for Google Sheets
            try:
                # First, try to find if this user_id already exists in the sheet
                range_name = "WhatsAppUserData!A:Z"  # Use a wide range to get all columns
                data = await sheets_service.read_data(range_name)
                
                # Check header row
                if not data or len(data) == 0:
                    # Create header row with entity names
                    header = ["user_id", "updated_at"]
                    for entity_name in save_user_data_config["schema"].keys():
                        header.append(entity_name)
                    
                    await sheets_service.write_data("WhatsAppUserData!A1", [header])
                    row_index = 2  # Start at row 2 after header
                    existing_row = None
                else:
                    # Find user_id column index (should be first column)
                    user_id_col = 0
                    
                    # Check if header row matches our schema
                    header = data[0]
                    if header[0] != "user_id" or header[1] != "updated_at":
                        # Update header to match current schema
                        header = ["user_id", "updated_at"]
                        for entity_name in save_user_data_config["schema"].keys():
                            if entity_name not in header:
                                header.append(entity_name)
                        
                        await sheets_service.write_data("WhatsAppUserData!A1", [header])
                    
                    # Find if user_id already exists
                    existing_row = None
                    row_index = None
                    
                    for i, row in enumerate(data[1:], 2):  # Start from second row (index 1) but keep row numbers starting from 2
                        if row and len(row) > user_id_col and row[user_id_col] == user_id:
                            existing_row = row
                            row_index = i
                            break
                
                # Prepare row data
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                if existing_row:
                    # Update existing row
                    row_data = [user_id, timestamp]
                    
                    # Fill in the entity values
                    for i, entity_name in enumerate(header[2:], 2):  # Start from 3rd column (index 2)
                        if entity_name in args:
                            row_data.append(str(args[entity_name]))
                        elif i < len(existing_row):
                            # Keep existing value
                            row_data.append(existing_row[i])
                        else:
                            # Add empty value
                            row_data.append("")
                    
                    # Update the row
                    await sheets_service.write_data(f"WhatsAppUserData!A{row_index}", [row_data])
                    return f"Данные пользователя обновлены: {', '.join([f'{k}={v}' for k, v in args.items()])}"
                else:
                    # Create new row
                    row_data = [user_id, timestamp]
                    
                    # Fill in the entity values according to header
                    for entity_name in header[2:]:  # Start from 3rd column
                        if entity_name in args:
                            row_data.append(str(args[entity_name]))
                        else:
                            # Add empty value
                            row_data.append("")
                    
                    # Append new row
                    await sheets_service.append_data("WhatsAppUserData!A:Z", [row_data])
                    return f"Данные пользователя сохранены: {', '.join([f'{k}={v}' for k, v in args.items()])}"
            except Exception as sheet_error:
                logger.error(f"Error working with Google Sheets: {str(sheet_error)}")
                return f"Ошибка при работе с Google Sheets: {str(sheet_error)}"
            
        except Exception as e:
            logger.error(f"Error processing save_user_data: {str(e)}")
            return f"Ошибка сохранения данных пользователя: {str(e)}"
    
    async def send_message(self, recipient_id, message_text):
        url = f"{self.base_url}/sendMessage/{self.api_token}"
        
        payload = {
            "chatId": f"{recipient_id}@c.us",
            "message": message_text
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error sending GreenAPI message: {str(e)}")
            raise e
    
    def truncate_conversation_history(self, user_id, assistant):
        strategy = assistant.get("truncation_strategy", {"type": "last_messages", "last_messages": 10})
        
        if strategy["type"] == "last_messages":
            max_messages = strategy.get("last_messages", 10)
            if len(self.user_sessions[user_id]) > max_messages * 2: 
                self.user_sessions[user_id] = self.user_sessions[user_id][-max_messages*2:]
    
    async def store_conversation_to_sheets(self, user_id, user_message, bot_response):
        try:
            # Try to find Google Sheets integration in multiple ways
            sheets_integration = await self.db.google_sheets_integrations.find_one({"assistant_id": self.assistant_id})
            
            if not sheets_integration:
                sheets_integration = await self.db.google_sheets_integrations.find_one({"assistant_id": str(self.assistant_id)})
            
            if not sheets_integration:
                integrations = await self.db.google_sheets_integrations.find().to_list(None)
                if integrations and len(integrations) > 0:
                    sheets_integration = integrations[0]
            
            if sheets_integration:
                try:
                    sheets_service = GoogleSheetsService(
                        sheets_integration.get("credentials_json"),
                        sheets_integration.get("spreadsheet_id")
                    )
                    
                    # Use a more specific range format (A1:D1000 instead of A:D)
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    await sheets_service.append_data(
                        "Conversations!A1:D1000",  # More specific range format
                        [[timestamp, user_id, user_message, bot_response]]
                    )
                except Exception as e:
                    logger.error(f"Error with Google Sheets in store_conversation: {str(e)}")
        except Exception as e:
            logger.error(f"Error storing conversation to sheets: {str(e)}")
    
    async def store_message_history(self, user_id: str, message: str, message_type: str):
        try:
            await self.db.whatsapp_user_history.insert_one({
                "user_id": user_id,
                "message": message,
                "message_type": message_type,
                "timestamp": datetime.now(),
                "assistant_id": self.assistant_id
            })
        except Exception as e:
            logger.error(f"Error storing message history: {str(e)}")
    
    async def get_user_history(self, user_id: str, limit: int = 50) -> list:
        cursor = self.db.whatsapp_user_history.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)