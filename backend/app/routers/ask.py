from fastapi import APIRouter, Depends
from ..deps import verify_api_key
from ..models import AskRequest, AskResponse
from ..services.vector_store import query_collection
from ..services.rerank import rerank_top3
from ..services.llm import answer_from_context

router = APIRouter(prefix="/v1", tags=["ask"])

@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest, _: bool = Depends(verify_api_key)):
    results = query_collection(req.question)
    documents = results.get("documents", [[]])[0] if results else []
    if not documents:
        return AskResponse(answer="No relevant context found. Please ingest a PDF first.",
                           retrieved=results.get("documents", []),
                           reranked_ids=[])
    context, ids = rerank_top3(req.question, documents)
    answer = answer_from_context(context=context, question=req.question)
    return AskResponse(answer=answer, retrieved=results.get("documents", []), reranked_ids=ids)
