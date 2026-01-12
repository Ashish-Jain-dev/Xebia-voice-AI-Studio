"""
LiveKit Voice Agent Worker for Xebia Voice AI Studio
Uses Gemini Realtime API for low-latency speech-to-speech conversations
Follows official LiveKit patterns for function tools and RAG integration
"""

import asyncio
import json
import logging
import os

import aiohttp
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    RunContext,
    mcp,  # Model Context Protocol integration
)
from livekit.agents.voice import AgentSession
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.plugins import google, bey

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
BEY_API_KEY = os.getenv("BEY_API_KEY")  # Beyond Presence avatar API key


async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for the voice agent.
    Uses Gemini Realtime API for low-latency speech-to-speech interaction.
    Follows official LiveKit pattern for realtime agents with function tools.
    """
    logger.info(f"Agent joining room: {ctx.room.name}")
    
    # Extract session_id from room name (format: session_{uuid})
    room_name = ctx.room.name
    if not room_name.startswith("session_"):
        logger.error(f"❌ Invalid room name format: {room_name}")
        raise ValueError("Room name must start with 'session_'")
    
    # Extract just the UUID part (everything after "session_")
    session_id = room_name[8:]  # Remove "session_" prefix (8 characters)
    logger.info(f"📋 Extracted session ID from room name: {session_id}")
    
    # Fetch agent configuration directly from backend API
    logger.info(f"🌐 Fetching agent config from backend API...")
    try:
        async with aiohttp.ClientSession() as http_session:
            # First, get the session to find the agent_id
            url = f"{BACKEND_URL}/api/sessions/{session_id}"
            async with http_session.get(url) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to fetch session: {response.status} - {error_text}")
                    raise Exception(f"Failed to fetch session: {error_text}")
                
                session_data = await response.json()
                agent_id = session_data.get("agent_id")
                logger.info(f"✅ Found agent_id from session: {agent_id}")
            
            # Now fetch the agent details
            url = f"{BACKEND_URL}/api/agents/{agent_id}"
            async with http_session.get(url) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to fetch agent: {response.status} - {error_text}")
                    raise Exception(f"Failed to fetch agent: {error_text}")
                
                agent_data = await response.json()
                agent_name = agent_data.get("name", "AI Assistant")
                base_system_prompt = agent_data.get("system_prompt", "You are a helpful AI assistant.")
                template_id = agent_data.get("template_id", "general")
                
                logger.info(f"✅ Loaded agent config from backend API")
    except Exception as e:
        logger.error(f"❌ Failed to fetch agent config from backend: {e}")
        # Fallback to defaults
        agent_id = "default"
        agent_name = "AI Assistant"
        base_system_prompt = "You are a helpful AI assistant."
        template_id = "general"
    
    # LOG: Show what we extracted
    logger.info(f"📋 Final Configuration:")
    logger.info(f"  - Agent ID: {agent_id}")
    logger.info(f"  - Session ID: {session_id}")
    logger.info(f"  - Agent Name: {agent_name}")
    logger.info(f"  - Base System Prompt (first 200 chars): {base_system_prompt[:200]}...")
    logger.info(f"  - Template ID: {template_id}")
    
    # Initialize MCP servers if configured
    logger.info("=" * 80)
    logger.info("🔌 MCP SERVER INITIALIZATION")
    logger.info("=" * 80)
    
    mcp_config = agent_data.get("mcp_config", {})
    mcp_servers_list = []
    
    if mcp_config and "servers" in mcp_config:
        logger.info(f"📋 Found {len(mcp_config['servers'])} MCP server(s) in agent configuration")
        
        for idx, server_config in enumerate(mcp_config['servers'], 1):
            try:
                server_name = server_config.get("name", f"MCP Server {idx}")
                server_type = server_config.get("type")
                
                logger.info(f"🔌 Initializing MCP server #{idx}: {server_name} (type: {server_type})")
                
                if server_type == "http":
                    # HTTP-based MCP server (SSE or Streamable)
                    url = server_config.get("url")
                    headers = server_config.get("headers", {})
                    
                    if not url:
                        logger.warning(f"⚠️ Skipping {server_name}: No URL provided")
                        continue
                    
                    logger.info(f"   - URL: {url}")
                    logger.info(f"   - Headers: {list(headers.keys()) if headers else 'None'}")
                    
                    mcp_server = mcp.MCPServerHTTP(
                        url=url,
                        headers=headers
                    )
                    mcp_servers_list.append(mcp_server)
                    logger.info(f"✅ Successfully registered HTTP MCP server: {server_name}")
                
                elif server_type == "stdio":
                    # Stdio-based MCP server (local subprocess)
                    # NOTE: Disabled for security reasons (command execution risk)
                    logger.warning(f"⚠️ Stdio MCP servers are disabled for security reasons")
                    logger.warning(f"   - Server '{server_name}' will not be initialized")
                    logger.warning(f"   - Please use HTTP-based MCP servers instead")
                    continue
                
                else:
                    logger.warning(f"⚠️ Unknown MCP server type: {server_type}")
                    continue
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize MCP server {server_name}: {e}")
                logger.error(f"   - Error type: {type(e).__name__}")
                logger.error(f"   - Error message: {str(e)}")
                continue
        
        logger.info(f"✅ MCP Initialization Complete: {len(mcp_servers_list)} server(s) registered")
    else:
        logger.info(f"📋 No MCP servers configured for this agent")
    
    logger.info("=" * 80)
    
    # Enhance system prompt with RAG instructions
    system_prompt = f"""{base_system_prompt}

IMPORTANT INSTRUCTIONS FOR KNOWLEDGE BASE:
- You have access to a knowledge base through the 'query_documents' function
- You MUST use this function for EVERY user question to search for relevant information
- Always check the knowledge base first before answering, even for seemingly general questions
- Base your answers primarily on information from the knowledge base when available
- If the knowledge base doesn't contain relevant information, you can use your general knowledge
- If you need time to search the knowledge base or process information, acknowledge the pause with natural conversational fillers (for example: “Umm… okay, give me a second”, “Alright, I’m looking into that now”), then continue with the response once ready.
- Always cite sources when using information from the documents"""
    
    # Add MCP-specific instructions if MCP servers are present
    if mcp_servers_list:
        mcp_instruction = """

EXTERNAL TOOLS VIA MCP SERVERS:
- You have access to external tools provided by Model Context Protocol (MCP) servers
- These tools extend your capabilities beyond the knowledge base
- When a user request requires external data, API calls, or actions, check if MCP tools can help
- Use MCP tools when appropriate for the user's request
- Always inform the user when you're using external tools for transparency
- Examples: API calls, database queries, file operations, external integrations, etc.

IMPORTANT FOR MCP TOOL USAGE:
- CAREFULLY read the tool's parameter names and descriptions
- Use the EXACT parameter names specified by the tool schema
- If a tool expects 'query', use 'query' not 'q'
- If a tool expects 'search', use 'search' not 's'
- Match parameter names PRECISELY to avoid errors
- If a tool call fails, check the error message for the correct parameter name and retry
"""
        system_prompt += mcp_instruction
        logger.info(f"🎯 Enhanced system prompt with MCP instructions ({len(mcp_servers_list)} servers)")
    
    logger.info(f"🎯 Final Enhanced System Prompt: {system_prompt[:200]}...")
    
    # Define RAG function tool (following official LiveKit Agents 1.0 pattern)
    @function_tool()
    async def query_documents(
        context: RunContext,
        question: str,
    ) -> str:
        """
        Search the knowledge base (uploaded documents) for relevant information.
        
        IMPORTANT: You MUST call this function for EVERY user question to check if there's
        relevant information in the uploaded documents. Always search the knowledge base
        before providing an answer, even for general questions, as the documents may
        contain specific information about the topic.
        
        Args:
            question: The user's question or the topic to search for in the documents
        """
        logger.info(f"🔍 RAG TOOL CALLED!")
        logger.info(f"   Question: {question}")
        logger.info(f"   Session ID: {session_id}")
        
        if not session_id:
            logger.warning(f"⚠️ No session_id available for RAG query")
            return "No session context available. I can only answer general questions."
        
        try:
            logger.info(f"📚 Querying backend RAG API...")
            
            # Call backend RAG API
            async with aiohttp.ClientSession() as http_session:
                url = f"{BACKEND_URL}/api/sessions/{session_id}/query"
                payload = {"question": question}
                
                async with http_session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        context_text = data.get("context", "")
                        sources = data.get("sources", [])
                        
                        # Format response with sources
                        if sources:
                            source_list = ", ".join(sources[:3])  # Top 3 sources
                            result = f"{context_text}\n\nSources: {source_list}"
                        else:
                            result = context_text
                        
                        logger.info(f"RAG returned {len(context_text)} chars, {len(sources)} sources")
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"RAG API error: {response.status} - {error_text}")
                        return f"I couldn't access the documents right now. I can still help with general questions."
                        
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            return "I encountered an error while searching the documents. Let me try to help with general knowledge."
    
    # Connect to the room first
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # LOG: Tool registration
    logger.info(f"🔧 Registering RAG tool: query_documents")
    logger.info(f"🔧 Tool description: {query_documents.__doc__[:100]}...")
    
    # Create custom agent class (following official LiveKit Agents 1.0 pattern)
    class XebiaVoiceAgent(Agent):
        """Custom voice agent with greeting and dynamic configuration"""
        
        def __init__(self):
            logger.info(f"🤖 Initializing XebiaVoiceAgent with:")
            logger.info(f"   Instructions (first 200 chars): {system_prompt[:200]}...")
            logger.info(f"   Tools: [query_documents]")
            
            super().__init__(
                instructions=system_prompt,  # Pass the enhanced system prompt
                tools=[query_documents],  # Attach RAG tool
            )
            
            logger.info(f"✅ XebiaVoiceAgent initialized successfully")
        
        async def on_enter(self) -> None:
            """Called when agent enters the session - send initial greeting"""
            greeting = f"Hello! I'm {agent_name}. How can I help you today?"
            logger.info(f"👋 Sending initial greeting: {greeting}")
            
            self.session.generate_reply(instructions=greeting)
    
    # Create the Gemini Realtime session (official LiveKit Agents 1.0 pattern)
    # Uses single model for speech-to-speech with ultra-low latency
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            # model defaults to "gemini-2.5-flash-native-audio-preview-12-2025"
            voice="Puck",  # Voice persona
            temperature=0.7,  # Response creativity
        ),
        turn_detection=MultilingualModel(),
        mcp_servers=mcp_servers_list if mcp_servers_list else None,  # Pass MCP servers!
    )
    
    if mcp_servers_list:
        logger.info(f"✅ Agent initialized with Gemini Realtime API, 1 RAG tool, and {len(mcp_servers_list)} MCP server(s)")
    else:
        logger.info(f"Agent initialized with Gemini Realtime API and 1 tool")
    
    # Initialize Beyond Presence Avatar (if API key is configured)
    logger.info("=" * 80)
    logger.info("🎭 AVATAR INITIALIZATION CHECK")
    logger.info("=" * 80)
    
    # Log environment variables
    bey_key_present = bool(BEY_API_KEY)
    
    # Try to get avatar ID from agent config first, fallback to environment variable
    bey_id = agent_data.get("avatar_id") or os.getenv("BEY_AVATAR_ID")
    
    logger.info(f"📋 BEY_API_KEY present: {bey_key_present}")
    logger.info(f"📋 Avatar ID source: {'Agent Config' if agent_data.get('avatar_id') else 'Environment Variable' if os.getenv('BEY_AVATAR_ID') else 'None'}")
    logger.info(f"📋 Avatar ID value: {bey_id if bey_id else 'NOT SET (Audio Only)'}")
    
    if not BEY_API_KEY:
        logger.warning(f"⚠️ BEY_API_KEY not found in environment")
        logger.info(f"🎵 Continuing with audio-only mode (visualizer will be shown)")
        logger.info("=" * 80)
    elif not bey_id or bey_id == '' or bey_id == 'null':
        logger.info(f"ℹ️ No avatar selected (audio-only mode chosen)")
        logger.info(f"🎵 Continuing with audio-only mode (visualizer will be shown)")
        logger.info("=" * 80)
    else:
        try:
            logger.info(f"🎭 Initializing Beyond Presence avatar...")
            logger.info(f"🎭 Avatar ID: {bey_id}")
            logger.info(f"🎭 Room: {ctx.room.name}")
            logger.info(f"🎭 Room SID: {ctx.room.sid}")
            
            # Create avatar session (correct Beyond Presence API)
            logger.info(f"🎭 Creating AvatarSession object...")
            avatar_session = bey.AvatarSession(avatar_id=bey_id)
            logger.info(f"✅ AvatarSession object created successfully")
            
            # Start avatar session - MUST pass BOTH session AND room!
            logger.info(f"🎭 Starting avatar session with session + room...")
            await avatar_session.start(session, room=ctx.room)
            logger.info(f"✅ Avatar session started successfully!")
            
            # Check if video track was published
            logger.info(f"🎭 Checking room tracks...")
            local_participant = ctx.room.local_participant
            logger.info(f"📹 Local participant: {local_participant.identity if local_participant else 'None'}")
            
            if local_participant:
                video_tracks = [track for track in local_participant.track_publications.values() 
                               if track.source == "camera" or track.kind == "video"]
                logger.info(f"📹 Video tracks published: {len(video_tracks)}")
                for track in video_tracks:
                    logger.info(f"   - Track: {track.sid}, Source: {track.source}, Kind: {track.kind}")
            
            logger.info(f"✅ Avatar session fully initialized with ID: {bey_id}")
            logger.info(f"🎭 Avatar video track SHOULD be visible to frontend!")
            logger.info("=" * 80)
            
        except Exception as e:
            logger.error(f"❌ Avatar initialization FAILED!")
            logger.error(f"❌ Error type: {type(e).__name__}")
            logger.error(f"❌ Error message: {str(e)}")
            logger.info(f"🎵 Continuing with audio-only mode (visualizer will be shown)")
            
            import traceback
            full_traceback = traceback.format_exc()
            logger.error(f"❌ Full traceback:\n{full_traceback}")
            logger.info("=" * 80)
    
    # #region agent log
    import json as json_debug
    try:
        with open(r'c:\Users\SangramG\Desktop\Maverick\.cursor\debug.log', 'a', encoding='utf-8') as f:
            f.write(json_debug.dumps({"sessionId":"debug-session","runId":"post-fix","hypothesisId":"G","location":"worker.py:127","message":"About to start session with Agent object","data":{"agent_name":agent_name,"agent_class":"XebiaVoiceAgent"},"timestamp":__import__('time').time()*1000})+'\n')
    except: pass
    # #endregion
    
    # Start the session with Agent object (correct v1.0 pattern)
    await session.start(agent=XebiaVoiceAgent(), room=ctx.room)
    
    # #region agent log
    try:
        with open(r'c:\Users\SangramG\Desktop\Maverick\.cursor\debug.log', 'a', encoding='utf-8') as f:
            f.write(json_debug.dumps({"sessionId":"debug-session","runId":"post-fix","hypothesisId":"G","location":"worker.py:post-start","message":"Session started successfully","data":{"session_state":"started"},"timestamp":__import__('time').time()*1000})+'\n')
    except: pass
    # #endregion
    
    # Log when agent is ready
    logger.info(f"Agent '{agent_name}' is now active in room {ctx.room.name}")


if __name__ == "__main__":
    # Start the worker with official LiveKit CLI
    logger.info("Starting LiveKit Voice Agent Worker (Gemini Realtime)...")
    logger.info(f"Backend URL: {BACKEND_URL}")
    logger.info(f"LiveKit URL: {LIVEKIT_URL}")
    logger.info("Using Gemini 2.5 Flash Realtime API for ultra-low latency")
    
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
