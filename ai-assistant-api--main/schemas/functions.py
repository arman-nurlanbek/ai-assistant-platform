from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FunctionModel(BaseModel):
    function_id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: str
    parameters: Dict[str, Any] = {}
    assistant_id: str
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "get_weather",
                "description": "Get weather information for a specific location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g., San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"],
                            "description": "The temperature unit to use"
                        }
                    },
                    "required": ["location"]
                },
                "assistant_id": "000000000000000000000000"
            }
        }
