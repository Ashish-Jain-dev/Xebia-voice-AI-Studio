import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle, Link2, Github, Globe, Plus } from 'lucide-react';
import { WizardData } from '@/pages/CreateAgent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StepDocumentsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
}

interface URLSource {
  type: 'sharepoint' | 'github' | 'website';
  url: string;
  name: string;
  status: 'pending' | 'connected' | 'error';
}

export function StepDocuments({ data, updateData }: StepDocumentsProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [urlSources, setUrlSources] = useState<URLSource[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // URL input states
  const [sharepointUrl, setSharepointUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const simulateUpload = (file: File) => {
    const newFile: UploadedFile = { file, status: 'uploading', progress: 0 };
    setUploadedFiles(prev => [...prev, newFile]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, status: 'processing', progress: 100 } : f
          )
        );
        // Simulate processing
        setTimeout(() => {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === file ? { ...f, status: 'ready' } : f
            )
          );
          updateData({ documents: [...data.documents, file] });
        }, 1500);
      } else {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, progress } : f
          )
        );
      }
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(simulateUpload);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(simulateUpload);
  };

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== file));
    updateData({ documents: data.documents.filter(d => d !== file) });
  };

  const addUrlSource = (type: 'sharepoint' | 'github' | 'website', url: string) => {
    if (!url.trim()) return;
    
    const newSource: URLSource = {
      type,
      url: url.trim(),
      name: url.trim().replace(/^https?:\/\//, '').substring(0, 50),
      status: 'pending'
    };
    
    setUrlSources(prev => [...prev, newSource]);
    
    // Simulate connection
    setTimeout(() => {
      setUrlSources(prev =>
        prev.map(s => s === newSource ? { ...s, status: 'connected' as const } : s)
      );
    }, 1500);
    
    // Clear input
    if (type === 'sharepoint') setSharepointUrl('');
    if (type === 'github') setGithubUrl('');
    if (type === 'website') setWebsiteUrl('');
  };

  const removeUrlSource = (source: URLSource) => {
    setUrlSources(prev => prev.filter(s => s !== source));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Knowledge Base</h2>
        <p className="text-muted-foreground mb-6">
          Upload documents or connect external knowledge sources for your agent.
        </p>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upload">📄 Upload Files</TabsTrigger>
            <TabsTrigger value="sharepoint">🔗 SharePoint</TabsTrigger>
            <TabsTrigger value="github">
              <Github className="w-4 h-4 mr-1" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="website">
              <Globe className="w-4 h-4 mr-1" />
              Websites
            </TabsTrigger>
          </TabsList>

          {/* Upload Files Tab */}
          <TabsContent value="upload" className="space-y-4">
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Drop files here to upload
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF, DOCX, and TXT files up to 10MB each
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-foreground">Uploaded Files</h3>
                {uploadedFiles.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="text-2xl">{getFileIcon(item.file.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(item.file.size)}</span>
                        {item.status === 'uploading' && (
                          <span className="text-primary">Uploading {item.progress}%</span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-amber-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          </span>
                        )}
                        {item.status === 'ready' && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </div>
                      {item.status === 'uploading' && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(item.file)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SharePoint Tab */}
          <TabsContent value="sharepoint" className="space-y-4">
            <div className="rounded-xl border border-border p-6 bg-muted/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Connect SharePoint</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect to SharePoint sites or document libraries to sync knowledge automatically.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="sharepoint-url">SharePoint URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="sharepoint-url"
                          placeholder="https://xebia.sharepoint.com/sites/..."
                          value={sharepointUrl}
                          onChange={(e) => setSharepointUrl(e.target.value)}
                        />
                        <Button 
                          onClick={() => addUrlSource('sharepoint', sharepointUrl)}
                          disabled={!sharepointUrl.trim()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected SharePoint Sources */}
            {urlSources.filter(s => s.type === 'sharepoint').length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Connected Sources</h3>
                {urlSources.filter(s => s.type === 'sharepoint').map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background"
                  >
                    <Link2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                    </div>
                    {source.status === 'pending' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {source.status === 'connected' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrlSource(source)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* GitHub Tab */}
          <TabsContent value="github" className="space-y-4">
            <div className="rounded-xl border border-border p-6 bg-muted/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Github className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Connect GitHub Repository</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect GitHub repositories to use README, wikis, and documentation as knowledge sources.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="github-url">Repository URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="github-url"
                          placeholder="https://github.com/organization/repository"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                        />
                        <Button 
                          onClick={() => addUrlSource('github', githubUrl)}
                          disabled={!githubUrl.trim()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected GitHub Repos */}
            {urlSources.filter(s => s.type === 'github').length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Connected Repositories</h3>
                {urlSources.filter(s => s.type === 'github').map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background"
                  >
                    <Github className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                    </div>
                    {source.status === 'pending' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {source.status === 'connected' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrlSource(source)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website" className="space-y-4">
            <div className="rounded-xl border border-border p-6 bg-muted/30">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Connect Website</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crawl and index custom websites, documentation portals, or internal wikis.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="website-url">Website URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="website-url"
                          placeholder="https://docs.example.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                        <Button 
                          onClick={() => addUrlSource('website', websiteUrl)}
                          disabled={!websiteUrl.trim()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Websites */}
            {urlSources.filter(s => s.type === 'website').length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Connected Websites</h3>
                {urlSources.filter(s => s.type === 'website').map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background"
                  >
                    <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                    </div>
                    {source.status === 'pending' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {source.status === 'connected' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrlSource(source)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
