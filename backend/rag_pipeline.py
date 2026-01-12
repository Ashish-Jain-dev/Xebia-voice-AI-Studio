"""
RAG Pipeline for document processing and retrieval
Handles document loading, chunking, embedding, and vector search
"""

import os
from typing import List, Dict, Optional
import tempfile
from pathlib import Path

# Document processing
from pypdf import PdfReader
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Vector store
import chromadb
from chromadb.config import Settings

# FastAPI
from fastapi import UploadFile
from dotenv import load_dotenv

load_dotenv()

class RAGPipeline:
    """RAG Pipeline for document processing and retrieval"""
    
    def __init__(self):
        self.chroma_path = os.getenv("CHROMADB_PATH", "./chroma_db")
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.use_local_embeddings = os.getenv("USE_LOCAL_EMBEDDINGS", "false").lower() == "true"
        
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=self.chroma_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Initialize embeddings with fallback
        self.embeddings = self._initialize_embeddings()
        
        # Text splitter configuration
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def _initialize_embeddings(self):
        """Initialize embeddings with automatic fallback to local on quota errors"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Force local embeddings if configured
        if self.use_local_embeddings:
            logger.info("🏠 Using LOCAL embeddings (sentence-transformers/all-MiniLM-L6-v2)")
            from langchain_community.embeddings import HuggingFaceEmbeddings
            return HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
        
        # Try Google embeddings first
        if self.google_api_key:
            try:
                logger.info("☁️ Attempting to use GOOGLE embeddings (embedding-001)")
                embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001",
                    google_api_key=self.google_api_key
                )
                # Test with a small embedding to check quota
                test_text = "test"
                embeddings.embed_query(test_text)
                logger.info("✅ Google embeddings initialized successfully")
                return embeddings
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "Quota exceeded" in error_msg:
                    logger.warning(f"⚠️ Google API quota exceeded, falling back to local embeddings")
                    logger.warning(f"   Error: {error_msg[:200]}")
                else:
                    logger.warning(f"⚠️ Google embeddings failed, falling back to local: {error_msg[:200]}")
        
        # Fallback to local embeddings
        logger.info("🏠 Using LOCAL embeddings (sentence-transformers/all-MiniLM-L6-v2)")
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting PDF text: {str(e)}")
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting DOCX text: {str(e)}")
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            raise Exception(f"Error reading TXT file: {str(e)}")
    
    def extract_text(self, file_path: str, filename: str) -> str:
        """Extract text based on file extension"""
        extension = Path(filename).suffix.lower()
        
        if extension == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif extension == '.docx':
            return self.extract_text_from_docx(file_path)
        elif extension == '.txt':
            return self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {extension}")
    
    async def process_document(
        self, 
        agent_id: str, 
        file: UploadFile,
        doc_id: str
    ) -> Dict:
        """Process document: extract text, chunk, embed, and store in ChromaDB"""
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text
            text = self.extract_text(tmp_file_path, file.filename)
            
            # Chunk text
            chunks = self.text_splitter.split_text(text)
            
            if not chunks:
                raise ValueError("No text chunks extracted from document")
            
            # Get or create collection for this agent
            collection_name = f"agent_{agent_id}"
            try:
                collection = self.chroma_client.get_collection(collection_name)
            except:
                collection = self.chroma_client.create_collection(
                    name=collection_name,
                    metadata={"agent_id": agent_id}
                )
            
            # Generate embeddings and store chunks
            chunk_ids = []
            documents = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc_id}_chunk_{i}"
                chunk_ids.append(chunk_id)
                documents.append(chunk)
                metadatas.append({
                    "document_id": doc_id,
                    "filename": file.filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                })
            
            # Generate embeddings
            embeddings_list = self.embeddings.embed_documents(documents)
            
            # Add to ChromaDB
            collection.add(
                ids=chunk_ids,
                embeddings=embeddings_list,
                documents=documents,
                metadatas=metadatas
            )
            
            return {
                "status": "success",
                "chunks_processed": len(chunks),
                "file_size": len(content),
                "collection_name": collection_name
            }
            
        finally:
            # Cleanup temporary file
            os.unlink(tmp_file_path)
    
    async def query_rag(
        self, 
        agent_id: str, 
        question: str,
        session_id: Optional[str] = None,
        k: int = 5
    ) -> Dict:
        """Query RAG pipeline for relevant document chunks"""
        
        # Determine collection name (session-specific or base)
        if session_id:
            collection_name = f"agent_{agent_id}_session_{session_id}"
        else:
            collection_name = f"agent_{agent_id}"
        
        try:
            collection = self.chroma_client.get_collection(collection_name)
        except Exception as e:
            return {
                "context": "",
                "sources": [],
                "error": f"Collection not found: {collection_name}"
            }
        
        # Generate embedding for question
        question_embedding = self.embeddings.embed_query(question)
        
        # Search ChromaDB
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=min(k, collection.count())
        )
        
        if not results['documents'] or not results['documents'][0]:
            return {
                "context": "",
                "sources": []
            }
        
        # Format context from retrieved chunks
        chunks = results['documents'][0]
        metadatas = results['metadatas'][0]
        
        # Build context string
        context_parts = []
        sources = set()
        
        for chunk, metadata in zip(chunks, metadatas):
            context_parts.append(chunk)
            sources.add(metadata['filename'])
        
        context = "\n\n".join(context_parts)
        
        return {
            "context": context,
            "sources": list(sources),
            "num_chunks": len(chunks)
        }
    
    def create_session_collection(self, agent_id: str, session_id: str) -> None:
        """Create a session-specific collection by copying agent's base collection"""
        base_collection_name = f"agent_{agent_id}"
        session_collection_name = f"agent_{agent_id}_session_{session_id}"
        
        try:
            # Check if base collection exists, create if it doesn't (for agents without documents)
            try:
                base_collection = self.chroma_client.get_collection(base_collection_name)
            except Exception:
                # Base collection doesn't exist (agent created without documents)
                # Create an empty base collection for this agent
                base_collection = self.chroma_client.create_collection(
                    name=base_collection_name,
                    metadata={"agent_id": agent_id}
                )
            
            # Get all documents from base collection (may be empty)
            all_data = base_collection.get(include=['embeddings', 'documents', 'metadatas'])
            
            # Create session collection
            session_collection = self.chroma_client.create_collection(
                name=session_collection_name,
                metadata={"agent_id": agent_id, "session_id": session_id}
            )
            
            # Copy data to session collection (if any exists)
            if all_data['ids'] and len(all_data['ids']) > 0:
                session_collection.add(
                    ids=all_data['ids'],
                    embeddings=all_data['embeddings'],
                    documents=all_data['documents'],
                    metadatas=all_data['metadatas']
                )
            # If no documents, session collection is created but empty (which is fine)
            
        except Exception as e:
            raise Exception(f"Error creating session collection: {str(e)}")
    
    def delete_session_collection(self, agent_id: str, session_id: str) -> None:
        """Delete a session-specific collection"""
        collection_name = f"agent_{agent_id}_session_{session_id}"
        try:
            self.chroma_client.delete_collection(collection_name)
        except Exception as e:
            # Collection might not exist, log but don't fail
            print(f"Warning: Could not delete collection {collection_name}: {str(e)}")
    
    def delete_agent_collection(self, agent_id: str) -> None:
        """Delete an agent's base collection"""
        collection_name = f"agent_{agent_id}"
        try:
            self.chroma_client.delete_collection(collection_name)
        except Exception as e:
            print(f"Warning: Could not delete collection {collection_name}: {str(e)}")
    
    def delete_document_chunks(self, agent_id: str, doc_id: str) -> None:
        """Delete all chunks for a specific document"""
        collection_name = f"agent_{agent_id}"
        try:
            collection = self.chroma_client.get_collection(collection_name)
            
            # Get all chunk IDs for this document
            results = collection.get(
                where={"document_id": doc_id}
            )
            
            if results['ids']:
                collection.delete(ids=results['ids'])
                
        except Exception as e:
            print(f"Warning: Could not delete document chunks: {str(e)}")

# Singleton instance
rag_pipeline = RAGPipeline()
