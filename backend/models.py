from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    template_id = Column(String)  # 'general', 'project', 'techstack', 'client'
    system_prompt = Column(Text)
    color = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    query_count = Column(Integer, default=0)
    document_count = Column(Integer, default=0)
    
    # NEW: Added fields for UI compatibility
    status = Column(String, default='active')  # 'active', 'inactive', 'draft'
    last_used = Column(DateTime, nullable=True)  # Tracks last query timestamp
    
    # Avatar configuration
    avatar_id = Column(String, nullable=True)  # Beyond Presence avatar ID
    
    # MCP Server configuration
    mcp_config = Column(JSON, nullable=True)  # Model Context Protocol server configuration
    # Stores: { "servers": [{"name": "...", "type": "http", "url": "...", "headers": {...}}] }
    
    # Relationships
    documents = relationship("Document", back_populates="agent", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="agent")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey('agents.id', ondelete='CASCADE'))
    filename = Column(String)
    file_size = Column(Integer)
    chunk_count = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="documents")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey('agents.id'))
    livekit_room_name = Column(String)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    query_count = Column(Integer, default=0)
    status = Column(String, default='active')  # 'active', 'completed'
    
    # Relationships
    agent = relationship("Agent", back_populates="sessions")
    queries = relationship("Query", back_populates="session")

class Query(Base):
    __tablename__ = "queries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey('sessions.id'))
    agent_id = Column(String, ForeignKey('agents.id'))
    question = Column(Text)
    answer = Column(Text)
    sources = Column(JSON)  # List of document filenames
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="queries")
