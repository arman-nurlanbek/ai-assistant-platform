import os
from openai import AsyncOpenAI
import logging
import traceback
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required but not provided.")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
    
    async def generate_response(self, messages: List[Dict[str, str]], 
                               model: str, 
                               temperature: float, 
                               max_tokens: int, 
                               functions: Optional[List[Dict[str, Any]]] = None):
        try:
            if functions and len(functions) > 0:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    tools=functions,
                    tool_choice="auto"
                )
            else:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            return response
        except Exception as e:
            logger.error(f"Error generating OpenAI response: {str(e)}")
            raise e
    
    def convert_functions_to_openai_format(self, functions_dict: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not functions_dict:
            return []
            
        openai_functions = []
        
        for function_name, function_info in functions_dict.items():
            function_def = {
                "type": "function",
                "function": {
                    "name": function_name,
                    "description": function_info.get("description", ""),
                    "parameters": function_info.get("parameters", {})
                }
            }
            openai_functions.append(function_def)
            
        return openai_functions
    
    async def process_function_calls(self, response):
        message = response.choices[0].message
        
        if hasattr(message, 'tool_calls') and message.tool_calls:
            function_calls = []
            
            for tool_call in message.tool_calls:
                if tool_call.type == 'function':
                    function_calls.append({
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    })
            
            return {
                "content": message.content,
                "function_calls": function_calls
            }
        
        return {
            "content": message.content,
            "function_calls": []
        }