from pydantic import BaseModel
from typing import Optional, Dict, Any
from bson import ObjectId


class TelegramIntegrationModel(BaseModel):
    bot_token: str
    webhook_url: Optional[str] = None
    assistant_id: Optional[str]
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class GreenAPIIntegrationModel(BaseModel):
    instance_id: str
    api_token: str
    assistant_id: Optional[str]
    nums: int = 7105
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class GoogleSheetsIntegrationModel(BaseModel):
    spreadsheet_id: str
    credentials_json: Dict[str, Any]
    assistant_id: Optional[str]
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}