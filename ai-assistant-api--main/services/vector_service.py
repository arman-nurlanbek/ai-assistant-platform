import os
import logging
from typing import List, Dict, Any, Optional
from bson import ObjectId
from qdrant_client import QdrantClient
from utils.embeddings import get_embeddings

logger = logging.getLogger(__name__)

QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
COLLECTION_NAME = os.getenv("VECTOR_COLLECTION_NAME", "knowledge_base")

class VectorSearchService:
    def __init__(self, db):
        self.db = db
        try:
            self.qdrant_client = QdrantClient(url=QDRANT_URL)
            logger.info(f"Connected to Qdrant at {QDRANT_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {str(e)}")
            self.qdrant_client = None

    async def search_knowledge_base(self, query: str, assistant_id: str, limit: int = 3) -> List[Dict[str, Any]]:
        try:
            if not self.qdrant_client:
                logger.error("Qdrant client not initialized")
                return []
                
            assistant = await self.db.assistants.find_one({"_id": ObjectId(assistant_id)})
            if not assistant:
                logger.error(f"Assistant {assistant_id} not found")
                return []
                
            query_embeddings = await get_embeddings(query, api_key=assistant.get("openai_id"))
            
            from qdrant_client.http.models import Filter, FieldCondition, MatchValue
            
            filter_obj = Filter(
                must=[
                    FieldCondition(key="assistant_id", match=MatchValue(value=str(assistant_id)))
                ]
            )
            
            search_results = self.qdrant_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embeddings,
                limit=limit,
                query_filter=filter_obj
            )
            
            mongodb_ids = [result.payload.get("mongodb_id") for result in search_results]
            
            result_docs = []
            for doc_id in mongodb_ids:
                try:
                    doc = await self.db.knowledge_texts.find_one({"_id": ObjectId(doc_id)})
                    if doc:
                        result_docs.append(doc)
                except Exception as e:
                    logger.error(f"Error fetching document {doc_id}: {e}")
            
            return result_docs
            
        except Exception as e:
            logger.error(f"Error searching knowledge base: {str(e)}")
            return []

    def format_context(self, docs: List[Dict[str, Any]]) -> str:
        if not docs:
            return ""
            
        context_parts = ["### Relevant information from knowledge base:"]
        
        for i, doc in enumerate(docs, 1):
            title = doc.get("title", "Untitled")
            content = doc.get("content", "")
            context_parts.append(f"\n## {i}. {title}\n{content}")
            
        return "\n".join(context_parts)