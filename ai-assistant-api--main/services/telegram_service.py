import os
import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, Any
from telebot.async_telebot import AsyncTeleBot
from telebot import types
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from services.openai_service import OpenAIService
from services.vector_service import VectorSearchService
from services.googlesheets_service import GoogleSheetsService

logger = logging.getLogger(__name__)

class TelegramBotService:
    def __init__(self, bot_token, assistant_id, mongodb_client):
        self.bot = AsyncTeleBot(bot_token)
        self.assistant_id = ObjectId(assistant_id)
        self.db = mongodb_client[os.getenv("DB_NAME", "ai_assistant_db")]
        self.user_sessions = {}
        self.vector_search = VectorSearchService(self.db)
        
        self.register_handlers()
    
    def register_handlers(self):
        @self.bot.message_handler(commands=['start'])
        async def start_command(message):
            assistant = await self.db.assistants.find_one({"_id": self.assistant_id})
            if assistant:
                await self.bot.reply_to(message, assistant.get("hello_message", "Я готов консультировать!"))
            else:
                await self.bot.reply_to(message, "Ассистент не настроен!")
        
        @self.bot.message_handler(func=lambda message: True)
        async def handle_messages(message):
            try:
                user_id = str(message.from_user.id)
                user_message = message.text
                
                await self.store_message_history(
                    user_id=user_id,
                    message=user_message,
                    message_type="user"
                )
                
                assistant = await self.db.assistants.find_one({"_id": self.assistant_id})
                if not assistant:
                    await self.bot.reply_to(message, "Ассистент не настроен!")
                    return
                
                if user_id not in self.user_sessions:
                    self.user_sessions[user_id] = []
                
                # Get relevant knowledge base entries
                kb_results = await self.vector_search.search_knowledge_base(
                    query=user_message,
                    assistant_id=str(self.assistant_id),
                    limit=3
                )
                
                # Format knowledge base results as context
                kb_context = self.vector_search.format_context(kb_results)
                
                # Add system message with instructions and knowledge base context
                system_message = assistant.get("instructions", "")
                if kb_context:
                    system_message += f"\n\n{kb_context}"
                
                # Add user message to session
                self.user_sessions[user_id].append({"role": "user", "content": user_message})
                
                # Add system message with context from knowledge base
                if system_message:
                    self.user_sessions[user_id].append({"role": "system", "content": system_message})
                
                self.truncate_conversation_history(user_id, assistant)
                
                openai_service = OpenAIService(api_key=assistant.get("openai_id"))
                
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
                
                response = await openai_service.generate_response(
                    messages=self.user_sessions[user_id],
                    model=assistant.get("model", "gpt-4"),
                    temperature=assistant.get("temperature", 0.7),
                    max_tokens=assistant.get("max_tokens", 2000),
                    functions=functions if functions else None
                )
                
                processed_response = await openai_service.process_function_calls(response)
                content = processed_response["content"] or ""
                
                if processed_response["function_calls"]:
                    response_message = await self.handle_function_calls(processed_response["function_calls"], user_id, content)
                else:
                    response_message = processed_response["content"]
                
                self.user_sessions[user_id].append({"role": "assistant", "content": response_message})
                
                await self.store_message_history(
                    user_id=user_id,
                    message=response_message,
                    message_type="bot"
                )
                
                await self.bot.reply_to(message, response_message)
                
                await self.store_conversation_to_sheets(user_id, user_message, response_message)
                
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                await self.bot.reply_to(message, assistant.get("error_message", "Извините, не доступен, обратитесь позже."))
    
    async def handle_function_calls(self, function_calls, user_id, processed_response_content):        
        function_responses = []
        
        for call in function_calls:
            try:
                func_name = call["name"]
                args = json.loads(call["arguments"])
                
                if func_name == "save_user_data":
                    # Handle save_user_data function
                    result = await self.process_save_user_data(user_id, processed_response_content, args)
                    function_responses.append(result)
                else:
                    # Handle other functions
                    args_str = ", ".join([f"{k}={v}" for k, v in args.items()])
                    function_responses.append(f"Функция вызвана: {func_name}({args_str})")
            
            except Exception as e:
                logger.error(f"Error processing function call: {str(e)}")
                function_responses.append(f"Функция вызвана: {call['name']} (ошибка: {str(e)})")
        
        return "\n".join(function_responses)
    
    async def process_save_user_data(self, user_id, processed_response_content, args):
        try:
            save_user_data_config = await self.db.save_user_data_function.find_one({"assistant_id": self.assistant_id})
            
            if not save_user_data_config:
                return f"{processed_response_content} \nОшибка: функция save_user_data не настроена"
            
            sheets_integration = None
            
            if save_user_data_config.get("integration_id"):
                sheets_integration = await self.db.google_sheets_integrations.find_one(
                    {"_id": ObjectId(save_user_data_config["integration_id"])}
                )
            
            if not sheets_integration:
                sheets_integration = await self.db.google_sheets_integrations.find_one(
                    {"assistant_id": self.assistant_id}
                )
            
            if not sheets_integration:
                sheets_integration = await self.db.google_sheets_integrations.find_one(
                    {"assistant_id": str(self.assistant_id)}
                )
            
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
            
            try:
                if 'telegram_id' not in args:
                    args['telegram_id'] = user_id
                
                range_name = "TelegramUserData!A1:Z1000"  # Use a more specific range
                data = await sheets_service.read_data(range_name)
                
                if not data or len(data) == 0:
                    header = ["user_id", "updated_at"]
                    for entity_name in save_user_data_config["schema"].keys():
                        header.append(entity_name)
                    
                    await sheets_service.write_data("TelegramUserData!A1", [header])
                    existing_row = None
                    existing_index = -1
                else:
                    header = data[0]
                    
                    if header[0] != "user_id" or header[1] != "updated_at":
                        header = ["user_id", "updated_at"]
                        for entity_name in save_user_data_config["schema"].keys():
                            if entity_name not in header:
                                header.append(entity_name)
                        
                        await sheets_service.write_data("TelegramUserData!A1", [header])
                    
                    existing_row = None
                    existing_index = -1
                    
                    for i, row in enumerate(data[1:], 1):  # Start from second row (index 1)
                        if row and len(row) > 0 and (row[0] == user_id or str(row[0]) == str(user_id)):
                            existing_row = row
                            existing_index = i
                            break
                
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                if existing_row and existing_index >= 0:
                    existing_data = {header[i]: existing_row[i] if i < len(existing_row) else "" 
                                for i in range(len(header))}
                    
                    existing_data.update(args)
                    existing_data["user_id"] = user_id
                    existing_data["updated_at"] = timestamp
                    
                    row_data = [existing_data.get(col, "") for col in header]
                    
                    range_to_update = f"TelegramUserData!A{existing_index + 1}:{chr(65 + len(header) - 1)}{existing_index + 1}"
                    await sheets_service.write_data(range_to_update, [row_data])
                    
                    return f"{processed_response_content} \nДанные пользователя обновлены!"
                else:
                    new_data = {"user_id": user_id, "updated_at": timestamp}
                    new_data.update(args)
                    
                    row_data = [new_data.get(col, "") for col in header]
                    
                    await sheets_service.append_data("TelegramUserData!A1:Z1000", [row_data])
                    
                    return f"{processed_response_content} \nДанные пользователя сохранены!"
                
            except Exception as sheet_error:
                logger.error(f"Error working with Google Sheets: {str(sheet_error)}")
                return f"Ошибка при работе с Google Sheets: {str(sheet_error)}"
                    
        except Exception as e:
            logger.error(f"Error processing save_user_data: {str(e)}")
            return f"Ошибка сохранения данных пользователя: {str(e)}"
    
    def truncate_conversation_history(self, user_id, assistant):
        strategy = assistant.get("truncation_strategy", {"type": "last_messages", "last_messages": 10})
        
        if strategy["type"] == "last_messages":
            max_messages = strategy.get("last_messages", 10)
            if len(self.user_sessions[user_id]) > max_messages * 2:  
                self.user_sessions[user_id] = self.user_sessions[user_id][-max_messages*2:]
    
    async def store_conversation_to_sheets(self, user_id, user_message, bot_response):
        try:
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
                    
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    await sheets_service.append_data(
                        "Conversations!A1:D1000",  
                        [[timestamp, user_id, user_message, bot_response]]
                    )
                except Exception as e:
                    logger.error(f"Error with Google Sheets in store_conversation: {str(e)}")
        except Exception as e:
            logger.error(f"Error storing conversation to sheets: {str(e)}")
    
    async def store_message_history(self, user_id: str, message: str, message_type: str):
        try:
            await self.db.telegram_user_history.insert_one({
                "user_id": user_id,
                "message": message,
                "message_type": message_type,
                "timestamp": datetime.now(),
                "assistant_id": self.assistant_id
            })
        except Exception as e:
            logger.error(f"Error storing message history: {str(e)}")
    
    async def get_user_history(self, user_id: str, limit: int = 50) -> list:
        cursor = self.db.telegram_user_history.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def start_bot(self):
        logger.info(f"Starting Telegram bot for assistant {self.assistant_id}")
        await self.bot.polling(non_stop=True)