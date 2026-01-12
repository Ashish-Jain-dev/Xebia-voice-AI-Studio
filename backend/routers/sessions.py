from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import os
from livekit import api

from database import get_db
from models import Session as SessionModel, Agent, Query
from schemas import SessionStartRequest, SessionStartResponse, SessionEndResponse, QueryRequest, QueryResponse
from rag_pipeline import rag_pipeline

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# LiveKit API client
livekit_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
livekit_api_key = os.getenv("LIVEKIT_API_KEY")
livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")

@router.get("/recent", response_model=list)
async def get_recent_activities(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent query activities for dashboard activity feed"""
    queries = db.query(Query).order_by(Query.timestamp.desc()).limit(limit).all()
    
    activities = []
    for query in queries:
        agent = db.query(Agent).filter(Agent.id == query.agent_id).first()
        activities.append({
            "id": query.id,
            "agent_id": query.agent_id,
            "agent_name": agent.name if agent else "Unknown",
            "query": query.question,
            "status": "success",  # Could be enhanced based on query result
            "timestamp": query.timestamp.isoformat()
        })
    
    return activities

@router.get("/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session details by ID"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "agent_id": session.agent_id,
        "livekit_room_name": session.livekit_room_name,
        "status": session.status,
        "started_at": session.started_at,
        "ended_at": session.ended_at
    }

@router.post("/start", response_model=SessionStartResponse)
async def start_session(data: SessionStartRequest, db: Session = Depends(get_db)):
    """Create a new session and return LiveKit room token"""
    agent = db.query(Agent).filter(Agent.id == data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    session_id = str(uuid.uuid4())
    room_name = f"session_{session_id}"
    
    # Create session in database
    session = SessionModel(
        id=session_id,
        agent_id=data.agent_id,
        livekit_room_name=room_name,
        started_at=datetime.utcnow(),
        status='active'
    )
    db.add(session)
    db.commit()
    
    try:
        # Create session-specific ChromaDB collection
        rag_pipeline.create_session_collection(data.agent_id, session_id)
        
        # Generate LiveKit access token
        token = api.AccessToken(livekit_api_key, livekit_api_secret)
        token.with_identity(f"user_{session_id}")
        token.with_name("User")
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
        ))
        
        # Create room with agent metadata
        lk_api = api.LiveKitAPI(
            url=livekit_url,
            api_key=livekit_api_key,
            api_secret=livekit_api_secret
        )
        
        # Create room with metadata containing agent_id, session_id, and system_prompt
        import json
        import logging
        logger = logging.getLogger(__name__)
        
        room_metadata_dict = {
            "agent_id": data.agent_id,
            "session_id": session_id,
            "agent_name": agent.name,
            "system_prompt": agent.system_prompt,  # ✅ Pass custom prompt to worker
            "template_id": agent.template_id
        }
        
        # LOG: Show what we're sending
        logger.info(f"📤 Creating LiveKit room with metadata:")
        logger.info(f"   Agent ID: {data.agent_id}")
        logger.info(f"   Session ID: {session_id}")
        logger.info(f"   Agent Name: {agent.name}")
        logger.info(f"   System Prompt: {agent.system_prompt[:100]}...")
        logger.info(f"   Template ID: {agent.template_id}")
        
        room_metadata = json.dumps(room_metadata_dict)
        
        await lk_api.room.create_room(
            api.CreateRoomRequest(
                name=room_name,
                metadata=room_metadata
            )
        )
        
        # Generate JWT token
        jwt_token = token.to_jwt()
        
        return SessionStartResponse(
            session_id=session_id,
            room_name=room_name,
            token=jwt_token
        )
    
    except Exception as e:
        # Rollback session creation if something fails
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@router.post("/{session_id}/end", response_model=SessionEndResponse)
async def end_session(session_id: str, db: Session = Depends(get_db)):
    """End session and cleanup ChromaDB collection"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Delete ChromaDB collection
    rag_pipeline.delete_session_collection(session.agent_id, session_id)
    
    # Update session status
    session.ended_at = datetime.utcnow()
    session.status = 'completed'
    db.commit()
    
    # Optionally delete the LiveKit room
    try:
        lk_api = api.LiveKitAPI(
            url=livekit_url,
            api_key=livekit_api_key,
            api_secret=livekit_api_secret
        )
        await lk_api.room.delete_room(api.DeleteRoomRequest(room=session.livekit_room_name))
    except Exception as e:
        # Room might already be deleted, just log the error
        print(f"Warning: Could not delete LiveKit room: {str(e)}")
    
    return SessionEndResponse(
        status="session_ended",
        ended_at=session.ended_at
    )

@router.post("/{session_id}/query", response_model=QueryResponse)
async def query_session(session_id: str, query_data: QueryRequest, db: Session = Depends(get_db)):
    """Manual query endpoint for testing RAG pipeline"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Query RAG pipeline
    result = await rag_pipeline.query_rag(
        agent_id=session.agent_id,
        question=query_data.question,
        session_id=session_id
    )
    
    # Log query to database
    query_record = Query(
        id=str(uuid.uuid4()),
        session_id=session_id,
        agent_id=session.agent_id,
        question=query_data.question,
        answer=result.get('context', ''),
        sources=result.get('sources', []),
        timestamp=datetime.utcnow()
    )
    
    session.query_count += 1
    
    # Update agent query count and last_used
    agent = db.query(Agent).filter(Agent.id == session.agent_id).first()
    if agent:
        agent.query_count += 1
        agent.last_used = datetime.utcnow()  # NEW: Track last usage
    
    db.add(query_record)
    db.commit()
    
    return QueryResponse(
        answer=result.get('context', ''),
        sources=result.get('sources', []),
        context=result.get('context', '')
    )
