"""
Quick test script to verify embedding setup
Run this to check if embeddings are working
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def test_embeddings():
    """Test embedding initialization and basic functionality"""
    
    print("\n" + "="*60)
    print("🔍 EMBEDDING SETUP TEST")
    print("="*60 + "\n")
    
    # Check environment
    use_local = os.getenv("USE_LOCAL_EMBEDDINGS", "false").lower() == "true"
    google_key = os.getenv("GOOGLE_API_KEY")
    
    print("📋 Environment Configuration:")
    print(f"   USE_LOCAL_EMBEDDINGS: {use_local}")
    print(f"   GOOGLE_API_KEY: {'✅ Set' if google_key else '❌ Not Set'}\n")
    
    # Try to initialize embeddings
    print("🔄 Initializing embeddings...")
    try:
        from rag_pipeline import RAGPipeline
        
        rag = RAGPipeline()
        print("✅ RAG Pipeline initialized successfully\n")
        
        # Check which embeddings are being used
        embeddings_type = type(rag.embeddings).__name__
        print(f"📦 Embedding Type: {embeddings_type}")
        
        if "HuggingFace" in embeddings_type:
            print("   🏠 Using LOCAL embeddings (sentence-transformers)")
            print("   ✅ No API quota issues!")
        elif "Google" in embeddings_type:
            print("   ☁️ Using GOOGLE embeddings (embedding-001)")
            print("   ⚠️ Subject to quota limits")
        else:
            print(f"   ❓ Unknown embedding type: {embeddings_type}")
        
        # Test embedding generation
        print("\n🧪 Testing embedding generation...")
        test_text = "This is a test sentence for embedding."
        
        try:
            embedding = rag.embeddings.embed_query(test_text)
            print(f"✅ Successfully generated embedding")
            print(f"   Embedding dimension: {len(embedding)}")
            print(f"   Sample values: [{embedding[0]:.4f}, {embedding[1]:.4f}, {embedding[2]:.4f}, ...]")
            
            # Test embedding multiple documents
            print("\n🧪 Testing batch embedding...")
            test_docs = ["Document 1", "Document 2", "Document 3"]
            batch_embeddings = rag.embeddings.embed_documents(test_docs)
            print(f"✅ Successfully generated {len(batch_embeddings)} embeddings")
            
            print("\n" + "="*60)
            print("✅ ALL TESTS PASSED!")
            print("="*60)
            print("\n📌 You can now:")
            print("   1. Create agents with documents")
            print("   2. Upload documents without quota errors")
            print("   3. Use RAG to answer questions")
            print("\n")
            
            return True
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Embedding generation failed: {error_msg[:200]}")
            
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                print("\n⚠️ GOOGLE API QUOTA EXCEEDED!")
                print("\n🔧 FIX:")
                print("   Add to backend/.env:")
                print("   USE_LOCAL_EMBEDDINGS=true")
                print("\n   Then restart backend and run this script again.")
            
            return False
            
    except Exception as e:
        print(f"❌ Failed to initialize RAG Pipeline: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_embeddings()
    sys.exit(0 if success else 1)
