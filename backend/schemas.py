from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Literal
from datetime import datetime

# MCP Server Configuration Schemas
class MCPServerConfig(BaseModel):
    """Configuration for a Model Context Protocol server"""
    name: str
    type: Literal["http", "stdio"]
    url: Optional[str] = None  # for http type
    command: Optional[str] = None  # for stdio type
    args: Optional[List[str]] = None  # for stdio type
    headers: Optional[Dict[str, str]] = None  # for http type
    env: Optional[Dict[str, str]] = None  # for stdio type

# Agent Schemas
class AgentCreate(BaseModel):
    name: str
    template_id: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    avatar_id: Optional[str] = None  # Beyond Presence avatar ID
    mcp_config: Optional[Dict] = None  # MCP server configuration

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    avatar_id: Optional[str] = None  # Beyond Presence avatar ID
    mcp_config: Optional[Dict] = None  # MCP server configuration

class AgentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    template_id: str
    system_prompt: str
    color: Optional[str]
    created_at: datetime
    updated_at: datetime
    query_count: int
    document_count: int
    status: str  # NEW: 'active', 'inactive', 'draft'
    last_used: Optional[datetime]  # NEW: Tracks last query timestamp
    avatar_id: Optional[str]  # Beyond Presence avatar ID
    mcp_config: Optional[Dict] = None  # MCP server configuration
    
    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    agent_id: str
    filename: str
    file_size: int
    chunk_count: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# Session Schemas
class SessionStartRequest(BaseModel):
    agent_id: str

class SessionStartResponse(BaseModel):
    session_id: str
    room_name: str
    token: str

class SessionEndResponse(BaseModel):
    status: str
    ended_at: datetime

# Query Schemas
class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    context: Optional[str] = None

# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_agents: int
    total_queries: int
    total_documents: int
    total_sessions: int

class AgentAnalytics(BaseModel):
    agent_name: str
    total_sessions: int
    total_queries: int
    documents_indexed: int
    last_used: Optional[datetime]

# Template Schemas
class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    color: str
