from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from database import get_db
from models import Agent, Document
from schemas import AgentCreate, AgentUpdate, AgentResponse, DocumentResponse
from templates import get_template, list_templates
from rag_pipeline import rag_pipeline
import os

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.get("/templates")
async def get_templates():
    """Get all available agent templates"""
    templates = list_templates()
    return {
        "templates": [
            {
                "id": key,
                "name": value["name"],
                "description": value["description"],
                "color": value["color"]
            }
            for key, value in templates.items()
        ]
    }

@router.post("/create", response_model=AgentResponse)
async def create_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """Create a new agent from template"""
    template = get_template(agent_data.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Use template defaults if not provided
    agent = Agent(
        id=str(uuid.uuid4()),
        name=agent_data.name or template["name"],
        description=agent_data.description or template["description"],
        template_id=agent_data.template_id,
        system_prompt=agent_data.system_prompt or template["system_prompt"],
        color=template["color"],
        avatar_id=agent_data.avatar_id,  # Store selected avatar ID
        mcp_config=agent_data.mcp_config,  # Store MCP server configuration
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(agent)
    db.commit()
    db.refresh(agent)
    
    return agent

@router.get("/list", response_model=List[AgentResponse])
async def list_agents(db: Session = Depends(get_db)):
    """List all agents"""
    agents = db.query(Agent).order_by(Agent.created_at.desc()).all()
    return agents

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Get agent details"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, agent_data: AgentUpdate, db: Session = Depends(get_db)):
    """Update agent configuration"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent_data.name is not None:
        agent.name = agent_data.name
    if agent_data.description is not None:
        agent.description = agent_data.description
    if agent_data.system_prompt is not None:
        agent.system_prompt = agent_data.system_prompt
    
    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)
    
    return agent

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    """Delete agent and cleanup vectors"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Cleanup ChromaDB collection
    rag_pipeline.delete_agent_collection(agent_id)
    
    db.delete(agent)
    db.commit()
    
    return {"status": "success", "message": "Agent deleted"}

@router.post("/{agent_id}/upload")
async def upload_document(
    agent_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document for an agent"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.txt']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create document record
    doc_id = str(uuid.uuid4())
    document = Document(
        id=doc_id,
        agent_id=agent_id,
        filename=file.filename,
        file_size=0,  # Will be updated after processing
        chunk_count=0,
        uploaded_at=datetime.utcnow()
    )
    
    try:
        # Process document through RAG pipeline
        result = await rag_pipeline.process_document(agent_id, file, doc_id)
        
        # Update document record
        document.file_size = result['file_size']
        document.chunk_count = result['chunks_processed']
        
        # Update agent document count
        agent.document_count += 1
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {
            "status": "success",
            "document": DocumentResponse.model_validate(document),
            "chunks_processed": result['chunks_processed']
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.get("/{agent_id}/documents", response_model=List[DocumentResponse])
async def list_documents(agent_id: str, db: Session = Depends(get_db)):
    """List all documents for an agent"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    documents = db.query(Document).filter(Document.agent_id == agent_id).all()
    return documents

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """Remove a document from an agent"""
    document = db.query(Document).filter(Document.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    agent_id = document.agent_id
    
    # Remove vectors from ChromaDB
    rag_pipeline.delete_document_chunks(agent_id, doc_id)
    
    db.delete(document)
    
    # Update agent document count
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent:
        agent.document_count = max(0, agent.document_count - 1)
    
    db.commit()
    
    return {"status": "success", "message": "Document deleted"}
