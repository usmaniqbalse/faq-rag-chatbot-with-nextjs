from pydantic import BaseModel
from typing import List, Any

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    retrieved: List[List[str]]  # mirrors Chroma "documents" shape
    reranked_ids: List[int]

class IngestResponse(BaseModel):
    message: str
    file_name: str
    chunks: int
