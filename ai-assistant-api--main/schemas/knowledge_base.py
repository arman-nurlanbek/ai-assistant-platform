from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime

class TextData(BaseModel):
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    assistant_id: Optional[str] = None

class TextDataResponse(BaseModel):
    id: str
    title: str
    content: str
    metadata: Dict[str, Any]
    assistant_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class TextDataUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    assistant_id: Optional[str] = None

class SearchQuery(BaseModel):
    query: str
    filter_by: Optional[Dict[str, Any]] = None
    limit: int = 10

class SearchResponse(BaseModel):
    results: List[TextDataResponse]
    total: int

    