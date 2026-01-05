import os
import logging
from typing import List, Optional
import numpy as np
from openai import AsyncOpenAI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_MODEL = "text-embedding-ada-002"

async def get_embeddings(text: str, api_key: Optional[str] = os.getenv("OPENAI_API_KEY"), model: str = DEFAULT_MODEL) -> List[float]:
    try:
        if not api_key:
            logger.warning("OpenAI API key not found. Using random embeddings for demonstration.")
            if model == "text-embedding-ada-002":
                return [np.random.uniform(-1, 1) for _ in range(1536)]
            else:
                return [np.random.uniform(-1, 1) for _ in range(768)]
        
        client = AsyncOpenAI(api_key=api_key)
        
        response = await client.embeddings.create(
            input=text,
            model=model
        )
        
        embeddings = response.data[0].embedding
        return embeddings
    
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        if model == "text-embedding-ada-002":
            return [np.random.uniform(-1, 1) for _ in range(1536)]
        else:
            return [np.random.uniform(-1, 1) for _ in range(768)]
