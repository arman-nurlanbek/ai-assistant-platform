from fastapi import APIRouter, HTTPException, Body, Query, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
from datetime import datetime
from bson import ObjectId
import logging
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import numpy as np
from utils.embeddings import get_embeddings
from schemas.knowledge_base import TextData, TextDataResponse, TextDataUpdate, SearchQuery, SearchResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
COLLECTION_NAME = os.getenv("VECTOR_COLLECTION_NAME", "knowledge_base")
VECTOR_SIZE = 1536  

def create_vector_store_router(db):
    router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])
    
    qdrant_client = QdrantClient(url=QDRANT_URL)
    
    try:
        collections = qdrant_client.get_collections()
        if COLLECTION_NAME not in [c.name for c in collections.collections]:
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
            )
            logger.info(f"Created collection {COLLECTION_NAME}")
    except Exception as e:
        logger.error(f"Error setting up Qdrant collection: {e}")
    
    @router.post("/", response_model=TextDataResponse)
    async def add_text(text_data: TextData = Body(...)):
        assistant = await db.assistants.find_one({"_id": ObjectId(text_data.assistant_id)})
        embeddings = await get_embeddings(text_data.content, api_key=assistant.get("openai_id"))
        
        doc = text_data.model_dump()
        doc["created_at"] = datetime.now()
        doc["updated_at"] = None
        
        result = await db.knowledge_texts.insert_one(doc)
        doc_id = str(result.inserted_id)
        
        point_id = int(str(result.inserted_id)[-6:], 16)  
        
        try:
            qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=embeddings,
                        payload={
                            "mongodb_id": doc_id,
                            "title": text_data.title,
                            "assistant_id": text_data.assistant_id,
                            **text_data.metadata
                        }
                    )
                ]
            )
        except Exception as e:
            await db.knowledge_texts.delete_one({"_id": result.inserted_id})
            logger.error(f"Qdrant insert failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to add text to vector store: {str(e)}")
        
        created_doc = await db.knowledge_texts.find_one({"_id": result.inserted_id})
        created_doc["id"] = doc_id
        created_doc["_id"] = doc_id
        
        return created_doc
    
    @router.get("/", response_model=List[TextDataResponse])
    async def get_texts(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        assistant_id: Optional[str] = None
    ):
        query = {}
        if assistant_id:
            query["assistant_id"] = assistant_id
        
        total = await db.knowledge_texts.count_documents(query)
        
        cursor = db.knowledge_texts.find(query).skip(skip).limit(limit)
        texts = await cursor.to_list(length=limit)
        
        for text in texts:
            text["id"] = str(text["_id"])
            text["_id"] = str(text["_id"])
        
        return texts
    
    @router.get("/count", response_model=Dict[str, int])
    async def count_texts(assistant_id: Optional[str] = None):
        query = {}
        if assistant_id:
            query["assistant_id"] = assistant_id
        
        count = await db.knowledge_texts.count_documents(query)
        return {"count": count}
    
    @router.get("/{text_id}", response_model=TextDataResponse)
    async def get_text(text_id: str):
        try:
            doc = await db.knowledge_texts.find_one({"_id": ObjectId(text_id)})
            if not doc:
                raise HTTPException(status_code=404, detail="Text not found")
            
            doc["id"] = str(doc["_id"])
            doc["_id"] = str(doc["_id"])
            return doc
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Text not found: {str(e)}")
    
    @router.put("/{text_id}", response_model=TextDataResponse)
    async def update_text(text_id: str, text_data: TextDataUpdate = Body(...)):
        try:
            assistant = await db.assistants.find_one({"_id": ObjectId(text_data.assistant_id)})
            update_data = {k: v for k, v in text_data.dict().items() if v is not None}
            update_data["updated_at"] = datetime.now()
            
            result = await db.knowledge_texts.update_one(
                {"_id": ObjectId(text_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Text not found")
            
            updated_doc = await db.knowledge_texts.find_one({"_id": ObjectId(text_id)})
            
            if "content" in update_data:
                point_id = int(text_id[-6:], 16)  
                embeddings = await get_embeddings(update_data["content"], api_key=assistant.get("openai_id"))
                
                payload = {
                    "mongodb_id": text_id,
                    "title": updated_doc["title"],
                    "assistant_id": updated_doc.get("assistant_id"),
                }
                
                if "metadata" in updated_doc:
                    payload.update(updated_doc["metadata"])
                
                try:
                    qdrant_client.upsert(
                        collection_name=COLLECTION_NAME,
                        points=[
                            PointStruct(
                                id=point_id,
                                vector=embeddings,
                                payload=payload
                            )
                        ]
                    )
                except Exception as e:
                    logger.error(f"Qdrant update failed: {e}")
                    raise HTTPException(status_code=500, detail=f"Failed to update text in vector store: {str(e)}")
            
            updated_doc["id"] = str(updated_doc["_id"])
            updated_doc["_id"] = str(updated_doc["_id"])
            return updated_doc
            
        except Exception as e:
            if not isinstance(e, HTTPException):
                raise HTTPException(status_code=500, detail=f"Failed to update text: {str(e)}")
            raise e
    
    @router.delete("/{text_id}")
    async def delete_text(text_id: str):
        try:
            result = await db.knowledge_texts.delete_one({"_id": ObjectId(text_id)})
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Text not found")
            
            point_id = int(text_id[-6:], 16) 
            try:
                qdrant_client.delete(
                    collection_name=COLLECTION_NAME,
                    points_selector=[point_id]
                )
            except Exception as e:
                logger.error(f"Qdrant delete failed: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to delete text from vector store: {str(e)}")
            
            return {"message": "Text deleted successfully"}
            
        except Exception as e:
            if not isinstance(e, HTTPException):
                raise HTTPException(status_code=500, detail=f"Failed to delete text: {str(e)}")
            raise e
    
    @router.post("/search", response_model=SearchResponse)
    async def search_texts(search_query: SearchQuery = Body(...)):
        try:
            
            query_embeddings = await get_embeddings(search_query.query)
            
            filter_obj = None
            if search_query.filter_by:
                conditions = []
                for key, value in search_query.filter_by.items():
                    if key == "assistant_id" and value:
                        conditions.append(FieldCondition(key="assistant_id", match=MatchValue(value=value)))
                    elif key in ["title", "metadata"]:
                        conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
                
                if conditions:
                    filter_obj = Filter(must=conditions)
            
            search_results = qdrant_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embeddings,
                limit=search_query.limit,
                query_filter=filter_obj
            )
            
            mongodb_ids = [result.payload.get("mongodb_id") for result in search_results]
            
            result_docs = []
            for doc_id in mongodb_ids:
                try:
                    doc = await db.knowledge_texts.find_one({"_id": ObjectId(doc_id)})
                    if doc:
                        doc["id"] = str(doc["_id"])
                        doc["_id"] = str(doc["_id"])
                        result_docs.append(doc)
                except Exception as e:
                    logger.error(f"Error fetching document {doc_id}: {e}")
            
            return {
                "results": result_docs,
                "total": len(result_docs)
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    
    return router