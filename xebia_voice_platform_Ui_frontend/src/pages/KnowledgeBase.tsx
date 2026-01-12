import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, File, MoreVertical, Trash2, Eye, Filter, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { agentsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Document {
  id: string;
  agent_id: string;
  filename: string;
  file_size: number;
  chunk_count: number;
  uploaded_at: string;
}

export default function KnowledgeBase() {
  const { agents } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch documents when agent is selected
  useEffect(() => {
    if (selectedAgentId) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [selectedAgentId]);

  const fetchDocuments = async () => {
    if (!selectedAgentId) return;
    
    setLoading(true);
    try {
      const response = await agentsAPI.getDocuments(selectedAgentId);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedAgentId) return;

    setUploading(true);
    try {
      await agentsAPI.uploadDocument(selectedAgentId, uploadFile);
      toast.success(`Document "${uploadFile.name}" uploaded successfully!`);
      setUploadDialogOpen(false);
      setUploadFile(null);
      fetchDocuments(); // Refresh list
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!confirm(`Delete "${filename}"? This will remove it from the vector store.`)) {
      return;
    }

    try {
      await agentsAPI.deleteDocument(docId);
      toast.success('Document deleted successfully');
      fetchDocuments(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocs.length} document(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedDocs.map(id => agentsAPI.deleteDocument(id)));
      toast.success(`${selectedDocs.length} document(s) deleted`);
      setSelectedDocs([]);
      fetchDocuments();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete documents');
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocs.map(d => d.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'docx' || ext === 'doc') return '📝';
    if (ext === 'txt') return '📝';
    return '📎';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Manage documents that power your AI agents
          </p>
        </div>
        <Button 
          className="btn-gradient"
          onClick={() => setUploadDialogOpen(true)}
          disabled={!selectedAgentId}
        >
          <Upload className="w-4 h-4 mr-2" /> Upload Documents
        </Button>
      </motion.div>

      {/* Agent Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card p-4 rounded-xl border border-border"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Agent
            </label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an agent to view its documents" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.color || '#6366f1' }}
                      />
                      <span>{agent.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({agent.documentCount || 0} docs)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedAgent && (
            <div className="text-sm text-muted-foreground">
              <div><strong>Template:</strong> {selectedAgent.templateId}</div>
              <div><strong>Documents:</strong> {documents.length}</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
        {selectedDocs.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedDocs.length})
          </Button>
        )}
      </motion.div>

      {/* Documents Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        {/* Table Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
          <Checkbox
            checked={selectedDocs.length === filteredDocs.length && filteredDocs.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Documents */}
        {!selectedAgentId ? (
          <div className="p-12 text-center">
            <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground mb-1">Select an agent</h3>
            <p className="text-sm text-muted-foreground">
              Choose an agent to view and manage its documents
            </p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${
                  selectedDocs.includes(doc.id) ? 'bg-primary/5' : ''
                }`}
              >
                <Checkbox
                  checked={selectedDocs.includes(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                />
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5 flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(doc.filename)}</span>
                    <div>
                      <p className="font-medium text-foreground">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunk_count} chunks indexed
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      Ready
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {formatDate(doc.uploaded_at)}
                  </div>
                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload documents to build this agent's knowledge base
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} className="btn-gradient">
              <Upload className="w-4 h-4 mr-2" /> Upload First Document
            </Button>
          </div>
        )}
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to <strong>{selectedAgent?.name}</strong>'s knowledge base
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Click to select a file
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, DOCX, and TXT files
                </p>
              </label>
            </div>

            {uploadFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUploadFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="btn-gradient"
            >
              {uploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
