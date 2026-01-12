"""
Diagnostic script to verify agent configuration and RAG setup
"""
import sys
from database import SessionLocal
from models import Agent, Document
from rag_pipeline import RAGPipeline

def test_agent_prompt():
    """Test if agent prompt is saved correctly"""
    print("\n" + "="*60)
    print("🔍 TESTING AGENT CONFIGURATION")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        agents = db.query(Agent).all()
        
        if not agents:
            print("❌ No agents found in database!")
            return False
        
        print(f"✅ Found {len(agents)} agent(s) in database\n")
        
        for i, agent in enumerate(agents, 1):
            print(f"Agent #{i}:")
            print(f"  ID: {agent.id}")
            print(f"  Name: {agent.name}")
            print(f"  Template: {agent.template_id}")
            print(f"  System Prompt: {agent.system_prompt[:200]}...")
            print(f"  Documents: {agent.document_count}")
            print(f"  Queries: {agent.query_count}")
            print()
        
        return True
    finally:
        db.close()

def test_documents():
    """Test if documents are uploaded and processed"""
    print("\n" + "="*60)
    print("📄 TESTING DOCUMENT UPLOADS")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        documents = db.query(Document).all()
        
        if not documents:
            print("⚠️ No documents found in database!")
            print("   Please upload documents via the UI")
            return False
        
        print(f"✅ Found {len(documents)} document(s)\n")
        
        for i, doc in enumerate(documents, 1):
            print(f"Document #{i}:")
            print(f"  ID: {doc.id}")
            print(f"  Filename: {doc.filename}")
            print(f"  Agent ID: {doc.agent_id}")
            print(f"  Chunks: {doc.chunk_count}")
            print(f"  Size: {doc.file_size} bytes")
            print()
        
        return True
    finally:
        db.close()

def test_rag_pipeline():
    """Test if RAG pipeline has indexed documents"""
    print("\n" + "="*60)
    print("🧠 TESTING RAG PIPELINE")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        rag = RAGPipeline()
        agents = db.query(Agent).all()
        
        if not agents:
            print("❌ No agents to test")
            return False
        
        for agent in agents:
            print(f"Testing Agent: {agent.name} ({agent.id})")
            
            # Check if agent has a ChromaDB collection
            try:
                collection = rag.get_agent_collection(agent.id)
                count = collection.count()
                
                if count > 0:
                    print(f"  ✅ ChromaDB collection exists with {count} chunks")
                    
                    # Try a test query
                    try:
                        results = collection.query(
                            query_texts=["test"],
                            n_results=1
                        )
                        print(f"  ✅ RAG query successful")
                        if results and results['documents'] and results['documents'][0]:
                            print(f"     Sample chunk: {results['documents'][0][0][:100]}...")
                    except Exception as e:
                        print(f"  ⚠️ RAG query failed: {e}")
                else:
                    print(f"  ⚠️ ChromaDB collection is empty (no documents indexed)")
            except Exception as e:
                print(f"  ❌ No ChromaDB collection found: {e}")
            
            print()
        
        return True
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "#"*60)
    print("# XEBIA VOICE AI STUDIO - DIAGNOSTIC TEST")
    print("#"*60)
    
    success = True
    
    # Test 1: Agent Configuration
    if not test_agent_prompt():
        success = False
    
    # Test 2: Documents
    if not test_documents():
        success = False
    
    # Test 3: RAG Pipeline
    if not test_rag_pipeline():
        success = False
    
    print("\n" + "="*60)
    if success:
        print("✅ ALL TESTS PASSED - Configuration looks good!")
        print("\nIf the agent still doesn't work, check the worker logs")
        print("when you click 'Test Agent' to see what's happening.")
    else:
        print("⚠️ SOME TESTS FAILED - Please review the output above")
    print("="*60 + "\n")
    
    sys.exit(0 if success else 1)
