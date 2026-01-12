from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Agent, Document, Session as SessionModel, Query
from schemas import AnalyticsOverview, AgentAnalytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(db: Session = Depends(get_db)):
    """Get overall platform statistics"""
    total_agents = db.query(Agent).count()
    total_queries = db.query(Query).count()
    total_documents = db.query(Document).count()
    total_sessions = db.query(SessionModel).count()
    
    return AnalyticsOverview(
        total_agents=total_agents,
        total_queries=total_queries,
        total_documents=total_documents,
        total_sessions=total_sessions
    )

@router.get("/agents/{agent_id}", response_model=AgentAnalytics)
async def get_agent_analytics(agent_id: str, db: Session = Depends(get_db)):
    """Get agent-specific analytics"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    sessions = db.query(SessionModel).filter(SessionModel.agent_id == agent_id).all()
    queries = db.query(Query).filter(Query.agent_id == agent_id).all()
    
    last_used = None
    if sessions:
        last_session = max(sessions, key=lambda s: s.started_at)
        last_used = last_session.started_at
    
    return AgentAnalytics(
        agent_name=agent.name,
        total_sessions=len(sessions),
        total_queries=len(queries),
        documents_indexed=agent.document_count,
        last_used=last_used
    )
