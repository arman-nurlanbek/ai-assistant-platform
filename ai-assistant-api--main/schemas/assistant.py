from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId



class FunctionModel(BaseModel):
    function_id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: str
    parameters: Dict[str, Any] = {}
    assistant_id: Optional[str]
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "000000000000000000000000",
                "name": "example_function",
                "description": "An example function",
                "parameters": {},
                "assistant_id": "000000000000000000000000"
            }
        }

class AIAssistantModel(BaseModel):
    assistant_id: Optional[str] = Field(default=None, alias="_id")
    openai_id: str = "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"
    name: str
    model: str
    instructions: Optional[str] = None
    temperature: float = 0.7
    functions_on: bool = False
    message_buffer: int = 1
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None
    hello_message: str = "Я готов консультировать!"
    error_message: str = "Извините, не доступен, обратитесь позже."
    max_tokens: int = 2000
    search_count: int = 20
    truncation_strategy: Dict[str, Any] = {
        "type": "last_messages",
        "last_messages": 10
    }
    min_relatedness: float = 0.3
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AIAssistantUpdateModel(BaseModel):
    openai_id: Optional[str] = None
    name: Optional[str] = None
    model: Optional[str] = None
    instructions: Optional[str] = None
    temperature: Optional[float] = None
    functions_on: Optional[bool] = None
    message_buffer: Optional[int] = None
    hello_message: Optional[str] = None
    error_message: Optional[str] = None
    max_tokens: Optional[int] = None
    search_count: Optional[int] = None
    truncation_strategy: Optional[Dict[str, Any]] = None
    min_relatedness: Optional[float] = None
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}