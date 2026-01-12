"""
LiveKit Voice Agent with Gemini 2.0 Flash and RAG integration
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import (
    AgentSession,
    WorkerOptions,
    cli,
    llm
)
from livekit.plugins import google
import httpx

load_dotenv()

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)


class VoiceAgent:
    """Voice AI Agent with RAG capabilities"""
    
    def __init__(
        self,
        session: AgentSession,
        agent_id: str,
        system_prompt: str,
        session_id: Optional[str] = None
    ):
        self.session = session
        self.agent_id = agent_id
        self.session_id = session_id
        self.system_prompt = system_prompt
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        
        logger.info(f"Initializing VoiceAgent for agent_id: {agent_id}")
        
        # Initialize Gemini 2.0 Flash with native audio
        self.model = google.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            voice="Puck",  # Natural, professional voice
            instructions=system_prompt,
            modalities=["AUDIO"],  # Native audio input/output
            api_key=os.getenv("GOOGLE_API_KEY"),
        )
    
    async def on_user_turn_completed(self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage):
        """
        Hook called when user finishes speaking - retrieve RAG context
        """
        logger.info(f"User turn completed: {new_message.content}")
        
        if not self.session_id:
            logger.warning("No session_id available for RAG query")
            return
        
        try:
            # Query backend RAG pipeline
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.backend_url}/api/sessions/{self.session_id}/query",
                    json={"question": new_message.content}
                )
                response.raise_for_status()
                rag_data = response.json()
            
            # Inject retrieved context into chat
            if rag_data.get('context'):
                context_msg = llm.ChatMessage(
                    role=llm.ChatRole.SYSTEM,
                    content=f"Retrieved context from documents:\n\n{rag_data['context']}\n\nUse this context to answer the user's question. Cite sources when possible."
                )
                
                # Update chat context with retrieved information
                self.session.update_chat_ctx([context_msg])
                
                logger.info(f"Injected RAG context with {len(rag_data.get('sources', []))} sources")
        
        except Exception as e:
            logger.error(f"Error querying RAG pipeline: {str(e)}")
            # Continue without context if RAG fails
    
    async def on_enter(self):
        """Called when agent enters the session"""
        await self.session.say(
            "Hello! I'm ready to help you with your questions. What would you like to know?"
        )
        logger.info("Agent entered session and greeted user")
    
    async def on_exit(self):
        """Called when agent exits the session"""
        logger.info("Agent exiting session")
    
    async def run(self):
        """Run the voice agent"""
        try:
            # Call enter hook
            await self.on_enter()
            
            # Start the agent with Gemini realtime model
            await self.session.start(self.model)
            
        except Exception as e:
            logger.error(f"Error running agent: {str(e)}")
            raise
        finally:
            await self.on_exit()


async def entrypoint(ctx: AgentSession):
    """
    Entrypoint for LiveKit agent worker
    Fetches agent configuration and starts voice agent
    """
    logger.info(f"Agent worker connecting to room: {ctx.room.name}")
    
    # Extract agent_id from room metadata
    try:
        room_metadata = ctx.room.metadata
        import json
        metadata = json.loads(room_metadata) if room_metadata else {}
        agent_id = metadata.get("agent_id")
        
        if not agent_id:
            logger.error("No agent_id found in room metadata")
            return
        
        logger.info(f"Fetching configuration for agent_id: {agent_id}")
        
        # Fetch agent configuration from backend
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{backend_url}/api/agents/{agent_id}")
            response.raise_for_status()
            agent_config = response.json()
        
        # Extract session_id from room name (format: session_{uuid})
        session_id = ctx.room.name.replace("session_", "") if "session_" in ctx.room.name else None
        
        # Create and run voice agent
        agent = VoiceAgent(
            session=ctx,
            agent_id=agent_id,
            system_prompt=agent_config["system_prompt"],
            session_id=session_id
        )
        
        await agent.run()
        
    except Exception as e:
        logger.error(f"Error in entrypoint: {str(e)}")
        raise


if __name__ == "__main__":
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=rtc.RoomEventType.AGENT_DISPATCH,
        )
    )
